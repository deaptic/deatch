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
        moderated_pending: false,
        connected: true,
        resume_at: None,
        moderated_retry_at: None,
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
    moderated_pending: bool,
    connected: bool,
    resume_at: Option<Instant>,
    moderated_retry_at: Option<Instant>,
}

impl Coordinator<'_> {
    fn publish(&self) {
        self.twitch.eventsub.publish(self.subs.stats());
    }

    fn next_wake(&self) -> Option<Instant> {
        let due = [self.subs.next_wake(), self.moderated_retry_at]
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
                self.moderated_retry_at = None;
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
        let new_viewer = self.viewer.as_ref().is_none_or(|v| v.id != id);
        if new_viewer {
            let moderated = HashSet::new();
            self.viewer = Some(Viewer { id, moderated });
        }
        if !refetch_due(
            new_viewer,
            self.moderated_stale,
            self.moderated_pending,
            self.moderated_retry_at,
            Instant::now(),
        ) {
            return;
        }
        self.moderated_stale = false;
        self.moderated_pending = true;
        spawn_moderated(
            self.twitch.clone(),
            authed.token.clone(),
            self.signals.clone(),
        );
    }

    /// A failed fetch keeps the last known list, so a blip never drops
    /// every moderator subscription.
    fn moderated(&mut self, viewer: UserId, result: Result<Vec<UserRef>>) {
        self.moderated_pending = false;
        if self.viewer.as_ref().is_none_or(|v| v.id != viewer) {
            return;
        }
        match result {
            Ok(channels) => {
                let moderated = channels.iter().map(|c| c.id.clone()).collect();
                emit(self.app, ModeratedChannelsChanged(channels));
                self.moderated_retry_at = None;
                self.viewer = Some(Viewer {
                    id: viewer,
                    moderated,
                });
            }
            Err(e) => {
                log::warn!("moderated channels fetch failed: {e}");
                self.moderated_stale = true;
                self.moderated_retry_at = Some(Instant::now() + MODERATED_RETRY);
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
                    let error = error.to_string();
                    self.chat_status(&subscription, ChatState::Failed { error });
                }
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
        let error = format!(
            "Twitch allows {MAX_CONNECTIONS} connections of {PER_CONNECTION} subscriptions"
        );
        for subscription in &capped {
            self.chat_status(
                subscription,
                ChatState::Failed {
                    error: error.clone(),
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

/// One fetch at a time; a failed one waits out its retry delay, a new
/// viewer never waits.
fn refetch_due(
    new_viewer: bool,
    stale: bool,
    pending: bool,
    retry_at: Option<Instant>,
    now: Instant,
) -> bool {
    !pending && (new_viewer || (stale && retry_at.is_none_or(|at| at <= now)))
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
    use super::{refetch_due, wake_at};
    use std::time::{Duration, Instant};

    #[test]
    fn stale_list_waits_for_its_retry_time() {
        let now = Instant::now();
        let later = Some(now + Duration::from_secs(30));
        assert!(!refetch_due(false, true, false, later, now));
        assert!(refetch_due(
            false,
            true,
            false,
            later,
            now + Duration::from_secs(30)
        ));
        assert!(refetch_due(false, true, false, None, now));
        assert!(!refetch_due(false, false, false, None, now));
        assert!(refetch_due(true, false, false, later, now));
    }

    #[test]
    fn never_fetches_twice_at_once() {
        let now = Instant::now();
        assert!(!refetch_due(true, true, true, None, now));
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
