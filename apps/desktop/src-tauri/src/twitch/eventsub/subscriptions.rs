use std::collections::{BTreeMap, HashMap, HashSet};
use std::fmt;
use std::time::{Duration, Instant};

use super::dto::{ConnectionState, ConnectionStats, EventSubStats};
use super::kind::{Focus, Role};
use super::EventKind;
use crate::error::{Error, Result};
use crate::twitch::ids::UserId;

pub(super) const MAX_CONNECTIONS: usize = 3;
pub(super) const PER_CONNECTION: usize = 300;
/// Drops shorter than this recover silently; longer ones surface as
/// disconnect/connect notices in the feed.
const NOTICE_GRACE: Duration = Duration::from_secs(10);
/// Retries never stop: a failing subscription is announced once the quick
/// retries run out, then keeps trying at the slowest pace.
const RETRY_DELAYS: [Duration; 4] = [
    Duration::from_secs(3),
    Duration::from_secs(10),
    Duration::from_secs(30),
    Duration::from_secs(60),
];

pub(super) type ConnId = u64;
pub(super) type Channels = HashMap<UserId, Focus>;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub(super) struct Subscription {
    pub(super) channel: UserId,
    pub(super) kind: EventKind,
}

impl fmt::Display for Subscription {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "kind={:?} broadcaster={}", self.kind, self.channel)
    }
}

pub(super) struct Viewer {
    pub(super) id: UserId,
    pub(super) moderated: HashSet<UserId>,
}

pub(super) struct Created {
    pub(super) conn: ConnId,
    pub(super) generation: u64,
    pub(super) subscription: Subscription,
    pub(super) result: Result<String>,
}

pub(super) struct Batch {
    pub(super) conn: ConnId,
    pub(super) session_id: String,
    pub(super) generation: u64,
    pub(super) subscriptions: Vec<Subscription>,
}

#[derive(Default)]
pub(super) struct Plan {
    pub(super) create: Vec<Batch>,
    pub(super) delete: Vec<(Subscription, String)>,
    pub(super) open: Option<ConnId>,
    pub(super) close: Vec<ConnId>,
    pub(super) capped: Vec<Subscription>,
}

pub(super) enum Outcome {
    Subscribed {
        announce: bool,
        recovered_since: Option<u64>,
    },
    Retrying {
        attempts: usize,
        delay: Duration,
        error: Error,
        announce: bool,
    },
    Orphaned(String),
    Discarded,
}

#[derive(Debug, PartialEq)]
enum State {
    Creating {
        conn: ConnId,
        attempts: usize,
    },
    Live {
        conn: ConnId,
        sub_id: String,
    },
    Retrying {
        attempts: usize,
        at: Instant,
    },
    /// Ready to create but waiting for a connection with room; keeps the
    /// attempt count so backoff survives a connection closing.
    Waiting {
        attempts: usize,
    },
    Capped,
}

impl State {
    fn conn(&self) -> Option<ConnId> {
        match self {
            State::Creating { conn, .. } | State::Live { conn, .. } => Some(*conn),
            State::Retrying { .. } | State::Waiting { .. } | State::Capped => None,
        }
    }
}

#[derive(Default)]
enum Link {
    #[default]
    Connecting,
    Up(String),
    Lost,
}

/// Ids are never reused, and `generation` moves on every drop, so a late
/// result can only ever match the session it was created for.
#[derive(Default)]
struct Conn {
    link: Link,
    generation: u64,
}

struct Gap {
    since_unix_ms: u64,
    started: Instant,
    notified: bool,
}

#[derive(Default)]
pub(super) struct Subs {
    channels: Channels,
    wanted: HashSet<Subscription>,
    states: HashMap<Subscription, State>,
    conns: BTreeMap<ConnId, Conn>,
    next_conn: ConnId,
    gaps: HashMap<UserId, Gap>,
}

impl Subs {
    pub(super) fn set_channels(&mut self, channels: Channels) {
        self.gaps.retain(|id, _| channels.contains_key(id));
        self.channels = channels;
    }

    pub(super) fn has_channel(&self, broadcaster_id: &UserId) -> bool {
        self.channels.contains_key(broadcaster_id)
    }

    pub(super) fn is_empty(&self) -> bool {
        self.channels.is_empty()
    }

    pub(super) fn is_creating(&self) -> bool {
        self.states
            .values()
            .any(|state| matches!(state, State::Creating { .. }))
    }

    pub(super) fn up(&mut self, conn: ConnId, session_id: String) {
        if let Some(c) = self.conns.get_mut(&conn) {
            c.link = Link::Up(session_id);
        }
    }

    pub(super) fn down(&mut self, conn: ConnId, now: Instant, since_unix_ms: u64) {
        let Some(c) = self.conns.get_mut(&conn) else {
            return;
        };
        c.link = Link::Lost;
        c.generation += 1;
        let gaps = &mut self.gaps;
        self.states.retain(|subscription, state| {
            if state.conn() != Some(conn) {
                return true;
            }
            if matches!(state, State::Live { .. })
                && subscription.kind == EventKind::ChannelChatMessage
            {
                gaps.entry(subscription.channel.clone()).or_insert(Gap {
                    since_unix_ms,
                    started: now,
                    notified: false,
                });
            }
            false
        });
    }

    pub(super) fn connected(&self) -> bool {
        !self.conns.values().any(|c| matches!(c.link, Link::Lost))
    }

    pub(super) fn stats(&self) -> EventSubStats {
        let mut stats = EventSubStats {
            max_connections: MAX_CONNECTIONS as u32,
            per_connection: PER_CONNECTION as u32,
            ..EventSubStats::default()
        };
        for state in self.states.values() {
            let counter = match state {
                State::Retrying { .. } => &mut stats.retrying,
                State::Waiting { .. } => &mut stats.waiting,
                State::Capped => &mut stats.capped,
                State::Creating { .. } | State::Live { .. } => continue,
            };
            *counter += 1;
        }
        stats.connections = self
            .conns
            .iter()
            .map(|(&id, conn)| ConnectionStats {
                state: match conn.link {
                    Link::Connecting => ConnectionState::Connecting,
                    Link::Up(_) => ConnectionState::Up,
                    Link::Lost => ConnectionState::Lost,
                },
                subscriptions: self
                    .states
                    .values()
                    .filter(|state| state.conn() == Some(id))
                    .count() as u32,
            })
            .collect();
        stats
    }

    pub(super) fn next_wake(&self) -> Option<Instant> {
        let retries = self.states.values().filter_map(|state| match state {
            State::Retrying { at, .. } => Some(*at),
            _ => None,
        });
        let notices = self
            .gaps
            .values()
            .filter(|gap| !gap.notified)
            .map(|gap| gap.started + NOTICE_GRACE);
        retries.chain(notices).min()
    }

    pub(super) fn due_notices(&mut self, now: Instant) -> Vec<UserId> {
        self.gaps
            .iter_mut()
            .filter(|(_, gap)| !gap.notified && gap.started + NOTICE_GRACE <= now)
            .map(|(id, gap)| {
                gap.notified = true;
                id.clone()
            })
            .collect()
    }

    /// Without a viewer nothing is wanted, so everything is torn down.
    /// Subscriptions go to the oldest connection with room; another
    /// connection opens when every one is full, and idle ones close.
    pub(super) fn plan(&mut self, viewer: Option<&Viewer>, now: Instant) -> Plan {
        self.wanted = viewer.map_or_else(HashSet::new, |v| wanted(&self.channels, v));
        let mut stale = Vec::new();
        let wanted = &self.wanted;
        self.states.retain(|subscription, state| {
            if wanted.contains(subscription) {
                return true;
            }
            if let State::Live { conn, sub_id } = state {
                stale.push((subscription.clone(), *conn, std::mem::take(sub_id)));
            }
            false
        });

        let mut pending: Vec<(Subscription, usize)> = self
            .wanted
            .iter()
            .filter_map(|subscription| match self.states.get(subscription) {
                None | Some(State::Capped) => Some((subscription.clone(), 0)),
                Some(State::Waiting { attempts }) => Some((subscription.clone(), *attempts)),
                Some(State::Retrying { attempts, at }) if *at <= now => {
                    Some((subscription.clone(), *attempts))
                }
                Some(_) => None,
            })
            .collect();
        pending.sort_by_cached_key(|(subscription, _)| priority(subscription, &self.channels));

        let mut load: BTreeMap<ConnId, usize> = self.conns.keys().map(|&id| (id, 0)).collect();
        for conn in self.states.values().filter_map(State::conn) {
            *load.entry(conn).or_default() += 1;
        }

        let mut batches: BTreeMap<ConnId, Vec<Subscription>> = BTreeMap::new();
        let mut overflow = Vec::new();
        for (subscription, attempts) in pending {
            let room = self
                .conns
                .iter()
                .find(|(id, c)| matches!(c.link, Link::Up(_)) && load[*id] < PER_CONNECTION)
                .map(|(id, _)| *id);
            match room {
                Some(conn) => {
                    *load.entry(conn).or_default() += 1;
                    self.states
                        .insert(subscription.clone(), State::Creating { conn, attempts });
                    batches.entry(conn).or_default().push(subscription);
                }
                None => overflow.push((subscription, attempts)),
            }
        }

        let all_up = self.conns.values().all(|c| matches!(c.link, Link::Up(_)));
        let can_open = all_up && self.conns.len() < MAX_CONNECTIONS;
        let room_coming = !all_up || can_open;
        let mut plan = Plan::default();
        if !overflow.is_empty() && can_open {
            let id = self.next_conn;
            self.next_conn += 1;
            self.conns.insert(id, Conn::default());
            plan.open = Some(id);
        }
        for (subscription, attempts) in overflow.iter().cloned() {
            if room_coming {
                self.states
                    .insert(subscription, State::Waiting { attempts });
            } else if self.states.insert(subscription.clone(), State::Capped) != Some(State::Capped)
            {
                plan.capped.push(subscription);
            }
        }

        if overflow.is_empty() {
            plan.close = self
                .conns
                .keys()
                .filter(|id| load.get(*id).is_none_or(|&n| n == 0))
                .copied()
                .collect();
            for id in &plan.close {
                self.conns.remove(id);
            }
        }
        plan.delete = stale
            .into_iter()
            .filter(|(_, conn, _)| self.conns.contains_key(conn))
            .map(|(subscription, _, sub_id)| (subscription, sub_id))
            .collect();
        plan.create = batches
            .into_iter()
            .filter_map(|(conn, subscriptions)| {
                let c = self.conns.get(&conn)?;
                let Link::Up(session_id) = &c.link else {
                    return None;
                };
                Some(Batch {
                    conn,
                    session_id: session_id.clone(),
                    generation: c.generation,
                    subscriptions,
                })
            })
            .collect();
        plan
    }

    pub(super) fn accept(&mut self, created: Created, now: Instant) -> Outcome {
        let Created {
            conn,
            generation,
            subscription,
            result,
        } = created;
        let current = self
            .conns
            .get(&conn)
            .is_some_and(|c| c.generation == generation);
        if !current {
            return Outcome::Discarded;
        }
        let attempts = match self.states.get(&subscription) {
            Some(State::Creating { conn: c, attempts }) if *c == conn => *attempts,
            _ => {
                return match result {
                    Ok(sub_id) => Outcome::Orphaned(sub_id),
                    Err(_) => Outcome::Discarded,
                }
            }
        };
        match result {
            Ok(sub_id) => {
                let gap = if subscription.kind == EventKind::ChannelChatMessage {
                    self.gaps.remove(&subscription.channel)
                } else {
                    None
                };
                self.states
                    .insert(subscription, State::Live { conn, sub_id });
                Outcome::Subscribed {
                    announce: gap.as_ref().is_none_or(|gap| gap.notified),
                    recovered_since: gap.map(|gap| gap.since_unix_ms),
                }
            }
            Err(error) => {
                let delay = RETRY_DELAYS[attempts.min(RETRY_DELAYS.len() - 1)];
                let attempts = attempts + 1;
                let at = now + delay;
                self.states
                    .insert(subscription, State::Retrying { attempts, at });
                Outcome::Retrying {
                    attempts,
                    delay,
                    error,
                    announce: attempts == RETRY_DELAYS.len(),
                }
            }
        }
    }

    /// Twitch revoked a live subscription; forgetting it lets the next plan
    /// recreate it if it is still wanted.
    pub(super) fn revoke(&mut self, sub_id: &str) -> Option<Subscription> {
        let revoked = self
            .states
            .iter()
            .find_map(|(subscription, state)| match state {
                State::Live { sub_id: id, .. } if id == sub_id => Some(subscription.clone()),
                _ => None,
            })?;
        self.states.remove(&revoked);
        Some(revoked)
    }
}

fn wanted(channels: &Channels, viewer: &Viewer) -> HashSet<Subscription> {
    channels
        .iter()
        .flat_map(|(channel, &focus)| {
            let role = role_in(channel, viewer);
            EventKind::ALL
                .into_iter()
                .filter(move |kind| {
                    let (needed_role, needed_focus) = kind.requires();
                    role >= needed_role && focus <= needed_focus
                })
                .map(move |kind| Subscription {
                    channel: channel.clone(),
                    kind,
                })
        })
        .collect()
}

/// Every channel's chat comes first so a full connection never starves a
/// chat; then focused channels' other kinds, then background ones.
fn priority(subscription: &Subscription, channels: &Channels) -> (bool, Focus, EventKind, UserId) {
    let focus = channels
        .get(&subscription.channel)
        .copied()
        .unwrap_or(Focus::Background);
    (
        subscription.kind != EventKind::ChannelChatMessage,
        focus,
        subscription.kind,
        subscription.channel.clone(),
    )
}

fn role_in(channel: &UserId, viewer: &Viewer) -> Role {
    if *channel == viewer.id {
        Role::Broadcaster
    } else if viewer.moderated.contains(channel) {
        Role::Moderator
    } else {
        Role::Viewer
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const CHAT: EventKind = EventKind::ChannelChatMessage;

    fn id(s: &str) -> UserId {
        UserId::from(s)
    }

    fn sub(channel: &str, kind: EventKind) -> Subscription {
        Subscription {
            channel: id(channel),
            kind,
        }
    }

    fn viewer(moderated: &[&str]) -> Viewer {
        Viewer {
            id: id("me"),
            moderated: moderated.iter().map(|s| id(s)).collect(),
        }
    }

    fn background(count: usize) -> Channels {
        (0..count)
            .map(|i| (id(&format!("c{i}")), Focus::Background))
            .collect()
    }

    fn subs_for(channels: Channels) -> Subs {
        let mut subs = Subs::default();
        subs.set_channels(channels);
        subs
    }

    fn plan(subs: &mut Subs) -> Plan {
        subs.plan(Some(&viewer(&[])), Instant::now())
    }

    fn created(batch: &Batch, subscription: Subscription, result: Result<String>) -> Created {
        Created {
            conn: batch.conn,
            generation: batch.generation,
            subscription,
            result,
        }
    }

    fn created_count(plan: &Plan) -> usize {
        plan.create.iter().map(|b| b.subscriptions.len()).sum()
    }

    fn land_all(subs: &mut Subs, plan: &Plan) {
        for batch in &plan.create {
            for subscription in &batch.subscriptions {
                let done = created(batch, subscription.clone(), Ok(subscription.to_string()));
                subs.accept(done, Instant::now());
            }
        }
    }

    fn connected_with_one_channel() -> Subs {
        let mut subs = subs_for(background(1));
        plan(&mut subs);
        subs.up(0, "s0".into());
        let first = plan(&mut subs);
        land_all(&mut subs, &first);
        subs
    }

    #[test]
    fn kinds_follow_role_and_focus() {
        let channels = Channels::from([
            (id("viewer"), Focus::Focused),
            (id("bg"), Focus::Background),
            (id("modded"), Focus::Focused),
            (id("me"), Focus::Focused),
        ]);
        let wanted = wanted(&channels, &viewer(&["modded", "bg"]));
        assert!(wanted.contains(&sub("viewer", EventKind::ChannelChatSettingsUpdate)));
        assert!(!wanted.contains(&sub("viewer", EventKind::ChannelModerate)));
        assert!(wanted.contains(&sub("bg", EventKind::AutomodMessageHold)));
        assert!(!wanted.contains(&sub("bg", EventKind::ChannelChatSettingsUpdate)));
        assert!(wanted.contains(&sub("modded", EventKind::ChannelModerate)));
        assert!(!wanted.contains(&sub("modded", EventKind::ChannelUpdate)));
        let own = wanted.iter().filter(|s| s.channel == id("me")).count();
        assert_eq!(own, EventKind::ALL.len());
    }

    #[test]
    fn opens_a_connection_then_creates_once_it_is_up() {
        let mut subs = subs_for(background(1));
        let first = plan(&mut subs);
        assert_eq!(first.open, Some(0));
        assert!(first.create.is_empty() && first.capped.is_empty());

        subs.up(0, "s0".into());
        let second = plan(&mut subs);
        assert_eq!(second.open, None);
        assert_eq!(second.create[0].session_id, "s0");
        assert_eq!(second.create[0].subscriptions[0], sub("c0", CHAT));
    }

    #[test]
    fn spills_into_more_connections_and_caps_only_past_three() {
        let mut subs = subs_for(background(200));
        assert_eq!(plan(&mut subs).open, Some(0));
        let total = subs.wanted.len();
        assert!(total > PER_CONNECTION * MAX_CONNECTIONS);

        let mut assigned = 0;
        for conn in 0..MAX_CONNECTIONS as ConnId {
            subs.up(conn, format!("s{conn}"));
            let next = plan(&mut subs);
            assert_eq!(next.create.len(), 1);
            assert_eq!(next.create[0].conn, conn);
            assigned += created_count(&next);
            if conn + 1 < MAX_CONNECTIONS as ConnId {
                assert_eq!(next.open, Some(conn + 1));
                assert!(next.capped.is_empty());
            } else {
                assert_eq!(next.open, None);
                assert_eq!(next.capped.len(), total - assigned);
                assert!(next.capped.iter().all(|s| s.kind != CHAT));
                assert!(plan(&mut subs).capped.is_empty());
            }
        }
        assert_eq!(assigned, PER_CONNECTION * MAX_CONNECTIONS);
    }

    #[test]
    fn a_lost_connection_hands_its_subscriptions_to_one_with_room() {
        let mut subs = connected_with_one_channel();
        subs.conns.insert(
            1,
            Conn {
                link: Link::Up("s1".into()),
                generation: 0,
            },
        );
        subs.next_conn = 2;
        subs.down(0, Instant::now(), 42);
        assert!(!subs.connected());
        let next = plan(&mut subs);
        assert!(next.create.iter().all(|batch| batch.conn == 1));
        assert!(created_count(&next) > 0);
        assert_eq!(next.close, [0]);
        assert!(subs.connected());
    }

    #[test]
    fn dropping_a_channel_deletes_only_its_subscriptions() {
        let mut subs = subs_for(background(2));
        plan(&mut subs);
        subs.up(0, "s0".into());
        let first = plan(&mut subs);
        land_all(&mut subs, &first);

        subs.set_channels(background(1));
        let next = plan(&mut subs);
        assert!(!next.delete.is_empty());
        assert!(next.delete.iter().all(|(s, _)| s.channel == id("c1")));
        assert!(next.close.is_empty());
    }

    #[test]
    fn without_a_viewer_connections_close_without_deleting() {
        let mut subs = connected_with_one_channel();
        let next = subs.plan(None, Instant::now());
        assert_eq!(next.close, [0]);
        assert!(next.delete.is_empty());
    }

    #[test]
    fn idle_connections_close_even_while_reconnecting() {
        let mut subs = connected_with_one_channel();
        subs.down(0, Instant::now(), 0);
        subs.set_channels(Channels::new());
        assert_eq!(subs.plan(None, Instant::now()).close, [0]);
        assert!(subs.connected());
    }

    #[test]
    fn results_from_an_old_session_are_discarded() {
        let mut subs = subs_for(background(1));
        plan(&mut subs);
        subs.up(0, "s0".into());
        let first = plan(&mut subs);
        let stale = created(&first.create[0], sub("c0", CHAT), Ok("old".into()));
        subs.down(0, Instant::now(), 0);
        assert!(matches!(
            subs.accept(stale, Instant::now()),
            Outcome::Discarded
        ));
    }

    #[test]
    fn unwanted_results_are_orphaned() {
        let mut subs = subs_for(background(1));
        plan(&mut subs);
        subs.up(0, "s0".into());
        let first = plan(&mut subs);
        subs.set_channels(Channels::from([(id("other"), Focus::Background)]));
        assert!(plan(&mut subs).close.is_empty());
        let late = created(&first.create[0], sub("c0", CHAT), Ok("late".into()));
        assert!(matches!(
            subs.accept(late, Instant::now()),
            Outcome::Orphaned(sub_id) if sub_id == "late"
        ));
    }

    #[test]
    fn failures_retry_forever_and_announce_once() {
        let mut subs = subs_for(Channels::from([(id("c0"), Focus::Focused)]));
        plan(&mut subs);
        subs.up(0, "s0".into());
        let mut now = Instant::now();
        let mut next = subs.plan(Some(&viewer(&[])), now);
        let mut announced = 0;
        for attempt in 1..=RETRY_DELAYS.len() + 2 {
            let batch = next
                .create
                .iter()
                .find(|b| b.subscriptions.contains(&sub("c0", CHAT)))
                .expect("chat is retried");
            let failed = created(batch, sub("c0", CHAT), Err(Error::Http("boom".into())));
            let Outcome::Retrying {
                attempts,
                delay,
                announce,
                ..
            } = subs.accept(failed, now)
            else {
                panic!("failures always retry");
            };
            assert_eq!(attempts, attempt);
            announced += usize::from(announce);
            now += delay;
            next = subs.plan(Some(&viewer(&[])), now);
        }
        assert_eq!(announced, 1);
    }

    #[test]
    fn backoff_survives_its_connection_closing() {
        let mut subs = subs_for(background(1));
        plan(&mut subs);
        subs.up(0, "s0".into());
        let mut now = Instant::now();
        let mut next = subs.plan(Some(&viewer(&[])), now);
        for attempt in 1..=RETRY_DELAYS.len() {
            let mut delay = Duration::ZERO;
            for batch in &next.create {
                for subscription in &batch.subscriptions {
                    let failed =
                        created(batch, subscription.clone(), Err(Error::Http("boom".into())));
                    let Outcome::Retrying {
                        attempts, delay: d, ..
                    } = subs.accept(failed, now)
                    else {
                        panic!("failures always retry");
                    };
                    assert_eq!(attempts, attempt);
                    delay = d;
                }
            }
            assert_eq!(subs.plan(Some(&viewer(&[])), now).close.len(), 1);
            now += delay;
            let conn = subs
                .plan(Some(&viewer(&[])), now)
                .open
                .expect("a connection reopens for the retry");
            subs.up(conn, format!("s{conn}"));
            next = subs.plan(Some(&viewer(&[])), now);
        }
    }

    #[test]
    fn reports_states_and_connections() {
        let mut subs = subs_for(Channels::from([
            (id("bg"), Focus::Background),
            (id("fg"), Focus::Focused),
        ]));
        plan(&mut subs);
        subs.up(0, "s0".into());
        let next = plan(&mut subs);
        let batch = &next.create[0];
        let failed = created(batch, sub("bg", CHAT), Err(Error::Http("boom".into())));
        subs.accept(failed, Instant::now());

        let stats = subs.stats();
        let total = subs.wanted.len() as u32;
        assert_eq!(stats.retrying, 1);
        assert_eq!(
            stats.connections,
            [ConnectionStats {
                state: ConnectionState::Up,
                subscriptions: total - 1,
            }]
        );
    }

    #[test]
    fn revoked_subscriptions_are_recreated() {
        let mut subs = connected_with_one_channel();
        let chat = sub("c0", CHAT);
        assert_eq!(subs.revoke(&chat.to_string()), Some(chat));
        assert_eq!(subs.revoke("unknown"), None);
        let next = plan(&mut subs);
        assert!(next
            .create
            .iter()
            .any(|b| b.subscriptions.contains(&sub("c0", CHAT))));
    }

    #[test]
    fn in_flight_creates_never_schedule_a_wake() {
        let mut subs = subs_for(background(1));
        plan(&mut subs);
        subs.up(0, "s0".into());
        plan(&mut subs);
        assert!(subs.is_creating());
        assert_eq!(subs.next_wake(), None);
    }

    #[test]
    fn short_drops_recover_quietly_and_long_ones_are_announced() {
        let mut subs = connected_with_one_channel();
        let dropped_at = Instant::now();
        subs.down(0, dropped_at, 7);
        assert!(subs.due_notices(dropped_at).is_empty());
        assert_eq!(subs.next_wake(), Some(dropped_at + NOTICE_GRACE));
        assert_eq!(subs.due_notices(dropped_at + NOTICE_GRACE), [id("c0")]);

        subs.up(0, "s0b".into());
        let next = plan(&mut subs);
        let back = created(&next.create[0], sub("c0", CHAT), Ok("back".into()));
        assert!(matches!(
            subs.accept(back, Instant::now()),
            Outcome::Subscribed {
                announce: true,
                recovered_since: Some(7)
            }
        ));
    }
}
