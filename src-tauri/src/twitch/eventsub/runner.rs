use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant};

use tauri::async_runtime::JoinHandle;
use tokio::sync::mpsc;

use super::super::moderation::events::ModeratedChannelsChanged;
use super::super::{Authed, Twitch};
use super::connection::{self, Notification};
use super::events::{ChatState, ChatStatus, EventSubConnection, EventSubRecovered};
use super::helix::{spawn_creates, spawn_deletes, spawn_moderated};
use super::subscriptions::{
    Channels, ConnId, Created, Outcome, Subs, Subscription, Viewer, MAX_CONNECTIONS, PER_CONNECTION,
};
use super::EventKind;
use crate::clock::unix_ms;
use crate::emit::{emit, emit_named};
use crate::error::{Error, Result};
use crate::twitch::ids::UserId;
use crate::twitch::users::dto::UserRef;

/// Twitch has no event for gaining or losing moderator status, so the list
/// is polled.
const MODERATED_REFRESH: Duration = Duration::from_secs(10 * 60);
const TOKEN_RETRY: Duration = Duration::from_secs(30);
const MODERATED_RETRY: Duration = Duration::from_secs(30);

pub(super) enum Signal {
    Up {
        conn: ConnId,
        session_id: String,
    },
    Down {
        conn: ConnId,
    },
    Notification(Notification),
    Revoked(String),
    Created(Created),
    Moderated {
        viewer: UserId,
        result: Result<Vec<UserRef>>,
    },
}

pub(super) async fn run(
    app: &tauri::AppHandle,
    twitch: &Twitch,
    mut channels_rx: mpsc::UnboundedReceiver<Channels>,
) {
    let (signals, mut signal_rx) = mpsc::unbounded_channel();
    let mut coordinator = Coordinator {
        app,
        twitch,
        signals,
        subs: Subs::default(),
        sockets: HashMap::new(),
        viewer: None,
        moderated_stale: false,
        moderated_fetch: ModeratedFetch::Idle,
        connected: true,
        resume_at: None,
    };
    let mut moderated_refresh = tokio::time::interval_at(
        tokio::time::Instant::now() + MODERATED_REFRESH,
        MODERATED_REFRESH,
    );
    moderated_refresh.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);

    loop {
        tokio::select! {
            channels = channels_rx.recv() => {
                let Some(channels) = channels else { break };
                coordinator.subs.set_channels(latest(channels, &mut channels_rx));
            }
            Some(signal) = signal_rx.recv() => match signal {
                Signal::Notification(notification) => {
                    coordinator.forward(notification);
                    continue;
                }
                Signal::Created(created) => {
                    coordinator.receive(created);
                    coordinator.publish();
                    if coordinator.subs.is_creating() {
                        continue;
                    }
                }
                Signal::Up { conn, session_id } => coordinator.subs.up(conn, session_id),
                Signal::Down { conn } => coordinator.subs.down(conn, Instant::now(), unix_ms()),
                Signal::Revoked(sub_id) => coordinator.revoke(&sub_id),
                Signal::Moderated { viewer, result } => coordinator.moderated(viewer, result),
            },
            _ = sleep_until(coordinator.next_wake()) => coordinator.announce_disconnects(),
            _ = moderated_refresh.tick() => coordinator.moderated_stale = true,
        }
        coordinator.sync().await;
        coordinator.publish();
    }
    coordinator.close_all();
}

struct Coordinator<'a> {
    app: &'a tauri::AppHandle,
    twitch: &'a Twitch,
    signals: mpsc::UnboundedSender<Signal>,
    subs: Subs,
    sockets: HashMap<ConnId, JoinHandle<()>>,
    viewer: Option<Viewer>,
    moderated_stale: bool,
    moderated_fetch: ModeratedFetch,
    connected: bool,
    resume_at: Option<Instant>,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum ModeratedFetch {
    Idle,
    InFlight,
    RetryAt(Instant),
}

impl ModeratedFetch {
    fn retry_at(self) -> Option<Instant> {
        match self {
            Self::RetryAt(at) => Some(at),
            Self::Idle | Self::InFlight => None,
        }
    }

    fn without_retry(self) -> Self {
        match self {
            Self::RetryAt(_) => Self::Idle,
            other => other,
        }
    }
}

impl Coordinator<'_> {
    fn publish(&self) {
        self.twitch.eventsub.publish(self.subs.stats());
    }

    fn next_wake(&self) -> Option<Instant> {
        let due = [self.subs.next_wake(), self.moderated_fetch.retry_at()]
            .into_iter()
            .flatten()
            .min();
        wake_at(due, self.resume_at)
    }

    /// Twitch closes a connection that gets no subscription within 10s, and
    /// creates stall while Helix is rate limited, so nothing opens or
    /// subscribes until requests flow again.
    async fn sync(&mut self) {
        let twitch = self.twitch;
        self.resume_at = twitch.rate_limited_for().map(|wait| Instant::now() + wait);
        if self.resume_at.is_some() {
            self.report_connection();
            return;
        }
        let authed = if self.subs.is_empty() {
            None
        } else {
            match twitch.authed().await {
                Ok(authed) => Some(authed),
                Err(Error::NotAuthenticated) => None,
                // A failed refresh is usually a blip; tearing everything down
                // would silently kill chat, so keep state and try again.
                Err(e) => {
                    log::warn!("eventsub sync postponed, token refresh failed: {e}");
                    self.resume_at = Some(Instant::now() + TOKEN_RETRY);
                    self.report_connection();
                    return;
                }
            }
        };
        match &authed {
            Some(authed) => self.refresh_viewer(authed),
            // The frontend drops its moderated list on logout, so the next
            // session must load and send it again even for the same user.
            None => {
                self.viewer = None;
                self.moderated_fetch = self.moderated_fetch.without_retry();
            }
        }

        let plan = self
            .subs
            .plan(authed.as_ref().and(self.viewer.as_ref()), Instant::now());
        self.report_connection();
        self.report_capped(plan.capped);
        spawn_deletes(self.twitch.clone(), plan.delete);
        for conn in plan.close {
            if let Some(socket) = self.sockets.remove(&conn) {
                log::info!("eventsub[{conn}] closing, no subscriptions left");
                socket.abort();
            }
        }
        if let Some(conn) = plan.open {
            log::info!("eventsub[{conn}] opening");
            let socket = connection::spawn(conn, self.signals.clone());
            self.sockets.insert(conn, socket);
        }
        if let Some(authed) = authed {
            for batch in plan.create {
                let token = authed.token.clone();
                spawn_creates(twitch.clone(), token, batch, self.signals.clone());
            }
        }
    }

    /// A new viewer gets their own-channel subscriptions right away; the
    /// moderator ones follow once the list lands.
    fn refresh_viewer(&mut self, authed: &Authed<'_>) {
        let id = UserId::from(authed.token.user_id.as_str());
        if self.viewer.as_ref().is_none_or(|v| v.id != id) {
            let moderated = HashSet::new();
            self.viewer = Some(Viewer { id, moderated });
            // Stored rather than acted on once, so a fetch still in flight for
            // the previous viewer can't swallow it.
            self.moderated_stale = true;
            self.moderated_fetch = self.moderated_fetch.without_retry();
        }
        if !refetch_due(self.moderated_stale, self.moderated_fetch, Instant::now()) {
            return;
        }
        self.moderated_stale = false;
        self.moderated_fetch = ModeratedFetch::InFlight;
        spawn_moderated(
            self.twitch.clone(),
            authed.token.clone(),
            self.signals.clone(),
        );
    }

    /// A failed fetch keeps the last known list, so a blip never drops
    /// every moderator subscription.
    fn moderated(&mut self, viewer: UserId, result: Result<Vec<UserRef>>) {
        self.moderated_fetch = ModeratedFetch::Idle;
        if self.viewer.as_ref().is_none_or(|v| v.id != viewer) {
            return;
        }
        match result {
            Ok(channels) => {
                let moderated = channels.iter().map(|c| c.id.clone()).collect();
                emit(self.app, ModeratedChannelsChanged(channels));
                self.viewer = Some(Viewer {
                    id: viewer,
                    moderated,
                });
            }
            Err(e) => {
                log::warn!("moderated channels fetch failed: {e}");
                self.moderated_stale = true;
                self.moderated_fetch = ModeratedFetch::RetryAt(Instant::now() + MODERATED_RETRY);
            }
        }
    }

    fn forward(&self, notification: Notification) {
        if self.subs.has_channel(&notification.broadcaster_id) {
            emit_named(self.app, notification.kind.event_name(), notification);
        }
    }

    fn receive(&mut self, created: Created) {
        let subscription = created.subscription.clone();
        match self.subs.accept(created, Instant::now()) {
            Outcome::Subscribed {
                announce,
                recovered_since,
            } => {
                log::info!("subscribed {subscription}");
                if announce {
                    self.chat_status(&subscription, ChatState::Connected);
                }
                if let Some(since) = recovered_since {
                    let broadcaster_id = subscription.channel;
                    emit(
                        self.app,
                        EventSubRecovered {
                            since,
                            broadcaster_id,
                        },
                    );
                }
            }
            Outcome::Retrying {
                attempts,
                delay,
                error,
                announce,
            } => {
                log::warn!(
                    "subscribe failed {subscription} attempt={attempts}, retrying in {delay:?}: {error}"
                );
                if announce {
                    self.chat_status(&subscription, ChatState::Failed { error });
                }
            }
            Outcome::Rejected(message) => {
                log::warn!("subscribe rejected {subscription}: {message}");
                self.chat_status(&subscription, ChatState::Rejected { message });
            }
            Outcome::Orphaned(sub_id) => {
                spawn_deletes(self.twitch.clone(), vec![(subscription, sub_id)]);
            }
            Outcome::Discarded => {}
        }
    }

    /// Revocations also follow lost moderator rights, so the list is reloaded.
    fn revoke(&mut self, sub_id: &str) {
        if let Some(subscription) = self.subs.revoke(sub_id) {
            log::warn!("revoked by Twitch {subscription}");
            self.moderated_stale = true;
        }
    }

    fn announce_disconnects(&mut self) {
        for broadcaster_id in self.subs.due_notices(Instant::now()) {
            log::info!("chat disconnected broadcaster={broadcaster_id}");
            emit(
                self.app,
                ChatStatus {
                    broadcaster_id,
                    state: ChatState::Disconnected,
                },
            );
        }
    }

    fn report_connection(&mut self) {
        if self.subs.connected() != self.connected {
            self.connected = self.subs.connected();
            emit(
                self.app,
                EventSubConnection {
                    connected: self.connected,
                },
            );
        }
    }

    fn report_capped(&self, capped: Vec<Subscription>) {
        if capped.is_empty() {
            return;
        }
        log::warn!(
            "eventsub full ({MAX_CONNECTIONS} connections x {PER_CONNECTION}), {} subscriptions skipped",
            capped.len()
        );
        for subscription in &capped {
            self.chat_status(
                subscription,
                ChatState::Capped {
                    connections: MAX_CONNECTIONS,
                    per_connection: PER_CONNECTION,
                },
            );
        }
    }

    fn chat_status(&self, subscription: &Subscription, state: ChatState) {
        if subscription.kind == EventKind::ChannelChatMessage {
            let broadcaster_id = subscription.channel.clone();
            emit(
                self.app,
                ChatStatus {
                    broadcaster_id,
                    state,
                },
            );
        }
    }

    fn close_all(&mut self) {
        for (_, socket) in self.sockets.drain() {
            socket.abort();
        }
    }
}

fn latest(first: Channels, rx: &mut mpsc::UnboundedReceiver<Channels>) -> Channels {
    let mut channels = first;
    while let Ok(next) = rx.try_recv() {
        channels = next;
    }
    channels
}

async fn sleep_until(at: Option<Instant>) {
    match at {
        Some(at) => tokio::time::sleep_until(at.into()).await,
        None => std::future::pending().await,
    }
}

/// One fetch at a time; a failed one waits out its retry delay.
fn refetch_due(stale: bool, fetch: ModeratedFetch, now: Instant) -> bool {
    stale
        && match fetch {
            ModeratedFetch::Idle => true,
            ModeratedFetch::InFlight => false,
            ModeratedFetch::RetryAt(at) => at <= now,
        }
}

/// Nothing due can run before sync resumes, so waking earlier would spin.
fn wake_at(due: Option<Instant>, resume: Option<Instant>) -> Option<Instant> {
    match (due, resume) {
        (Some(due), Some(resume)) => Some(due.max(resume)),
        (due, resume) => due.or(resume),
    }
}

#[cfg(test)]
mod tests {
    use super::{refetch_due, wake_at, ModeratedFetch};
    use std::time::{Duration, Instant};

    #[test]
    fn stale_list_waits_for_its_retry_time() {
        let now = Instant::now();
        let later = ModeratedFetch::RetryAt(now + Duration::from_secs(30));
        assert!(!refetch_due(true, later, now));
        assert!(refetch_due(true, later, now + Duration::from_secs(30)));
        assert!(refetch_due(true, ModeratedFetch::Idle, now));
        assert!(!refetch_due(false, ModeratedFetch::Idle, now));
    }

    #[test]
    fn never_fetches_twice_at_once() {
        let now = Instant::now();
        assert!(!refetch_due(true, ModeratedFetch::InFlight, now));
    }

    #[test]
    fn only_a_waiting_retry_sets_a_wake_time() {
        let at = Instant::now();
        assert_eq!(ModeratedFetch::RetryAt(at).retry_at(), Some(at));
        assert_eq!(ModeratedFetch::InFlight.retry_at(), None);
        assert_eq!(ModeratedFetch::Idle.retry_at(), None);
    }

    #[test]
    fn dropping_a_retry_leaves_a_fetch_in_flight() {
        let at = Instant::now();
        assert_eq!(
            ModeratedFetch::RetryAt(at).without_retry(),
            ModeratedFetch::Idle
        );
        assert_eq!(
            ModeratedFetch::InFlight.without_retry(),
            ModeratedFetch::InFlight
        );
    }

    #[test]
    fn wakes_no_earlier_than_sync_resumes() {
        let now = Instant::now();
        let soon = now + Duration::from_secs(5);
        let later = now + Duration::from_secs(60);
        assert_eq!(wake_at(Some(soon), Some(later)), Some(later));
        assert_eq!(wake_at(Some(later), Some(soon)), Some(later));
        assert_eq!(wake_at(Some(soon), None), Some(soon));
        assert_eq!(wake_at(None, Some(soon)), Some(soon));
        assert_eq!(wake_at(None, None), None);
    }
}
