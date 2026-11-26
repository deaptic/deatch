use super::events::{LinkAnswer, LinkChannel, LinkDisconnected, LinkState};
use super::MAX_MESSAGE_SIZE;
use crate::platform::emit::emit;
use interprocess::os::windows::security_descriptor::SecurityDescriptor;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;
use std::time::Duration;
use sysinfo::{ProcessRefreshKind, ProcessesToUpdate, System, Uid, UpdateKind};

const PIPE_PREFIX: &str = "deatch-bridge";
const ACCEPT_RETRY: Duration = Duration::from_secs(1);
const LISTEN_RETRY: Duration = Duration::from_secs(5);
const WRITE_TIMEOUT: Duration = Duration::from_secs(2);

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum HostCommand {
    SetMuted {
        channel: String,
        muted: bool,
    },
    Focus {
        channel: String,
    },
    Close {
        channel: String,
    },
    SetGain {
        channel: String,
        gain: f64,
    },
    SetCompressor {
        on: bool,
    },
    ClaimBonus {
        channel: String,
    },
    Redeem {
        channel: String,
        reward: String,
        cost: u64,
        text: Option<String>,
        request: String,
    },
    ClaimDrops {
        channel: String,
        request: String,
    },
    GetState,
}

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum HostMessage {
    State(Box<LinkState>),
    Redeemed(LinkAnswer),
    DropsClaimed(LinkAnswer),
}

pub fn connect_to_gui() -> std::io::Result<interprocess::local_socket::Stream> {
    use interprocess::local_socket::{prelude::*, GenericNamespaced, Stream, ToNsName};
    let own = current_user()?;
    let name = pipe_name(&own).to_ns_name::<GenericNamespaced>()?;
    let stream = Stream::connect(name)?;
    let server = stream.peer_creds()?.pid().and_then(user_of);
    same_user(Some(&own), server.as_ref())?;
    Ok(stream)
}

type HostWriter = tokio::io::WriteHalf<interprocess::local_socket::tokio::Stream>;

struct Host {
    writer: HostWriter,
    state: LinkState,
    reported_at: u64,
    _close: tokio::sync::oneshot::Sender<()>,
}

#[derive(Default)]
struct Connected {
    hosts: BTreeMap<u64, Host>,
    next_id: u64,
    reports: u64,
}

fn encode(command: &HostCommand) -> std::io::Result<Vec<u8>> {
    let mut payload = serde_json::to_vec(command)?;
    payload.push(b'\n');
    Ok(payload)
}

async fn write(writer: &mut HostWriter, payload: &[u8]) -> bool {
    use tokio::io::AsyncWriteExt;
    match tokio::time::timeout(WRITE_TIMEOUT, writer.write_all(payload)).await {
        Ok(Ok(())) => true,
        Ok(Err(e)) => {
            log::warn!("ipc write failed: {e}");
            false
        }
        Err(_) => {
            log::warn!("ipc write timed out after {WRITE_TIMEOUT:?}");
            false
        }
    }
}

impl Connected {
    async fn broadcast(&mut self, payload: &[u8]) {
        let mut broken = Vec::new();
        for (id, host) in self.hosts.iter_mut() {
            if !write(&mut host.writer, payload).await {
                broken.push(*id);
            }
        }
        for id in broken {
            self.hosts.remove(&id);
        }
    }
}

#[derive(Clone, Default)]
pub struct Hosts(Arc<tokio::sync::Mutex<Connected>>);

impl Hosts {
    pub async fn send(&self, command: &HostCommand) -> std::io::Result<()> {
        if self.send_if_connected(command).await? {
            Ok(())
        } else {
            Err(std::io::Error::new(
                std::io::ErrorKind::NotConnected,
                "host not connected",
            ))
        }
    }

    pub async fn replay(&self, app: &tauri::AppHandle) {
        let connected = self.0.lock().await;
        if connected.hosts.values().any(|host| host.reported_at > 0) {
            emit_merged(app, &connected.hosts);
        }
    }

    pub async fn send_if_connected(&self, command: &HostCommand) -> std::io::Result<bool> {
        let mut connected = self.0.lock().await;
        if connected.hosts.is_empty() {
            return Ok(false);
        }
        connected.broadcast(&encode(command)?).await;
        Ok(true)
    }
}

fn union<V: Clone>(into: &mut Option<BTreeMap<String, V>>, reported: &Option<BTreeMap<String, V>>) {
    if let Some(reported) = reported {
        into.get_or_insert_with(BTreeMap::new)
            .extend(reported.clone());
    }
}

fn latest(
    into: &mut Option<BTreeMap<String, String>>,
    reported: &Option<BTreeMap<String, String>>,
) {
    let Some(reported) = reported else { return };
    let merged = into.get_or_insert_with(BTreeMap::new);
    for (channel, at) in reported {
        let newer = merged
            .get(channel)
            .is_none_or(|known| parse_time(at) > parse_time(known));
        if newer {
            merged.insert(channel.clone(), at.clone());
        }
    }
}

fn parse_time(at: &str) -> Option<time::OffsetDateTime> {
    time::OffsetDateTime::parse(at, &time::format_description::well_known::Rfc3339).ok()
}

fn merge<'a>(states: impl Iterator<Item = (u64, &'a LinkState)>) -> LinkState {
    let mut channels: BTreeMap<&str, bool> = BTreeMap::new();
    let mut current: Option<(u64, &str)> = None;
    let mut audio = false;
    let mut gains: Option<BTreeMap<String, f64>> = None;
    let mut balances: Option<BTreeMap<String, u64>> = None;
    let mut bonus_ready: BTreeSet<&str> = BTreeSet::new();
    let mut rewards = None;
    let mut subscribed = None;
    let mut drops = None;
    let mut earned_at: Option<BTreeMap<String, String>> = None;
    let mut compressor_on: Option<bool> = None;
    for (reported_at, state) in states {
        audio |= state.audio;
        union(&mut gains, &state.gains);
        union(&mut balances, &state.balances);
        union(&mut rewards, &state.rewards);
        union(&mut subscribed, &state.subscribed);
        union(&mut drops, &state.drops);
        latest(&mut earned_at, &state.earned_at);
        if let Some(on) = state.compressor_on {
            compressor_on = Some(compressor_on.unwrap_or(false) || on);
        }
        bonus_ready.extend(state.bonus_ready.iter().map(String::as_str));
        for ch in &state.channels {
            channels
                .entry(&ch.login)
                .and_modify(|muted| *muted &= ch.muted)
                .or_insert(ch.muted);
        }
        if let Some(login) = &state.current {
            if current.is_none_or(|(at, _)| reported_at > at) {
                current = Some((reported_at, login));
            }
        }
    }
    LinkState {
        channels: channels
            .into_iter()
            .map(|(login, muted)| LinkChannel {
                login: login.to_string(),
                muted,
            })
            .collect(),
        current: current.map(|(_, login)| login.to_string()),
        audio,
        gains,
        balances,
        bonus_ready: bonus_ready.into_iter().map(str::to_string).collect(),
        subscribed,
        drops,
        earned_at,
        compressor_on,
        rewards,
    }
}

fn emit_merged(app: &tauri::AppHandle, hosts: &BTreeMap<u64, Host>) {
    if hosts.is_empty() {
        emit(app, LinkDisconnected);
    } else {
        emit(
            app,
            merge(hosts.values().map(|h| (h.reported_at, &h.state))),
        );
    }
}

pub fn start_server(app: tauri::AppHandle, hosts: Hosts) {
    tauri::async_runtime::spawn(async move {
        loop {
            if let Err(e) = run_server(app.clone(), hosts.clone()).await {
                log::warn!("ipc server not listening, retrying: {e}");
            }
            tokio::time::sleep(LISTEN_RETRY).await;
        }
    });
}

async fn run_server(app: tauri::AppHandle, hosts: Hosts) -> std::io::Result<()> {
    use interprocess::local_socket::{
        tokio::prelude::*, GenericNamespaced, ListenerOptions, ToNsName,
    };

    use interprocess::os::windows::local_socket::ListenerOptionsExt;

    let own = current_user()?;
    let name = pipe_name(&own).to_ns_name::<GenericNamespaced>()?;
    let listener = ListenerOptions::new()
        .name(name)
        .security_descriptor(only_for(&own)?)
        .create_tokio()?;

    loop {
        match listener.accept().await {
            Ok(conn) => {
                tauri::async_runtime::spawn(handle_connection(app.clone(), hosts.clone(), conn));
            }
            Err(e) => {
                log::warn!("ipc accept failed: {e}");
                tokio::time::sleep(ACCEPT_RETRY).await;
            }
        }
    }
}

fn current_user() -> std::io::Result<Uid> {
    user_of(std::process::id()).ok_or_else(|| std::io::Error::other("current user unknown"))
}

fn pipe_name(user: &Uid) -> String {
    format!("{PIPE_PREFIX}-{}", **user)
}

fn only_for(user: &Uid) -> std::io::Result<SecurityDescriptor> {
    let sddl =
        widestring::U16CString::from_str(format!("D:P(A;;GA;;;{})S:(ML;;NWNRNX;;;ME)", **user))
            .map_err(std::io::Error::other)?;
    SecurityDescriptor::deserialize(&sddl)
}

fn user_of(pid: u32) -> Option<Uid> {
    let pid = sysinfo::Pid::from_u32(pid);
    let mut system = System::new().ok()?;
    system.refresh_processes_specifics(
        ProcessesToUpdate::Some(&[pid]),
        false,
        ProcessRefreshKind::nothing().with_user(UpdateKind::Always),
    );
    system.process(pid)?.user_id().cloned()
}

fn same_user(own: Option<&Uid>, server: Option<&Uid>) -> std::io::Result<()> {
    match (own, server) {
        (Some(own), Some(server)) if own == server => Ok(()),
        (Some(_), Some(_)) => Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "the pipe belongs to another user",
        )),
        _ => Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "the pipe's owner could not be checked",
        )),
    }
}

async fn read_line<R>(reader: &mut R) -> std::io::Result<Option<String>>
where
    R: tokio::io::AsyncBufRead + Unpin,
{
    use tokio::io::{AsyncBufReadExt, AsyncReadExt};
    let invalid = |e: String| std::io::Error::new(std::io::ErrorKind::InvalidData, e);
    let mut buf = Vec::new();
    let read = (&mut *reader)
        .take(MAX_MESSAGE_SIZE as u64 + 1)
        .read_until(b'\n', &mut buf)
        .await?;
    if read == 0 {
        return Ok(None);
    }
    if buf.last() == Some(&b'\n') {
        buf.pop();
        if buf.last() == Some(&b'\r') {
            buf.pop();
        }
    } else if buf.len() > MAX_MESSAGE_SIZE {
        return Err(invalid("line exceeds the message size limit".into()));
    }
    String::from_utf8(buf)
        .map(Some)
        .map_err(|e| invalid(e.to_string()))
}

async fn handle_connection(
    app: tauri::AppHandle,
    hosts: Hosts,
    conn: interprocess::local_socket::tokio::Stream,
) {
    let (read_half, writer) = tokio::io::split(conn);
    let (close, mut closed) = tokio::sync::oneshot::channel();
    let id = {
        let mut connected = hosts.0.lock().await;
        let id = connected.next_id;
        connected.next_id += 1;
        connected.hosts.insert(
            id,
            Host {
                writer,
                state: LinkState::default(),
                reported_at: 0,
                _close: close,
            },
        );
        id
    };

    let mut reader = tokio::io::BufReader::new(read_half);
    loop {
        let read = tokio::select! {
            read = read_line(&mut reader) => read,
            _ = &mut closed => break,
        };
        let line = match read {
            Ok(Some(line)) => line,
            Ok(None) => break,
            Err(e) => {
                log::warn!("ipc read failed: {e}");
                break;
            }
        };
        match serde_json::from_str::<HostMessage>(&line) {
            Ok(HostMessage::State(state)) => {
                let mut connected = hosts.0.lock().await;
                connected.reports += 1;
                let reported_at = connected.reports;
                if let Some(host) = connected.hosts.get_mut(&id) {
                    host.state = *state;
                    host.reported_at = reported_at;
                }
                emit_merged(&app, &connected.hosts);
            }
            Ok(HostMessage::Redeemed(answer) | HostMessage::DropsClaimed(answer)) => {
                emit(&app, answer)
            }
            Err(e) => log::warn!("ipc bad message: {e} — {line}"),
        }
    }

    let mut connected = hosts.0.lock().await;
    connected.hosts.remove(&id);
    emit_merged(&app, &connected.hosts);
}

#[cfg(test)]
mod tests {
    use super::{
        current_user, merge, only_for, pipe_name, read_line, same_user, HostCommand, HostMessage,
        Hosts, LinkAnswer, LinkChannel, LinkState, MAX_MESSAGE_SIZE,
    };
    use serde_json::json;
    use sysinfo::Uid;

    #[test]
    fn only_a_pipe_run_by_the_same_user_is_trusted() {
        let me: Uid = "S-1-5-21-1-2-3-1001".parse().unwrap();
        let other: Uid = "S-1-5-21-1-2-3-1002".parse().unwrap();
        assert!(same_user(Some(&me), Some(&me)).is_ok());
        assert!(same_user(Some(&me), Some(&other)).is_err());
        assert!(same_user(Some(&me), None).is_err());
        assert!(same_user(None, Some(&me)).is_err());
    }

    #[test]
    fn each_user_gets_their_own_pipe() {
        let me: Uid = "S-1-5-21-1-2-3-1001".parse().unwrap();
        let other: Uid = "S-1-5-21-1-2-3-1002".parse().unwrap();
        assert_eq!(pipe_name(&me), "deatch-bridge-S-1-5-21-1-2-3-1001");
        assert_ne!(pipe_name(&me), pipe_name(&other));
    }

    #[test]
    fn lower_integrity_processes_cannot_use_the_pipe() {
        use interprocess::os::windows::security_descriptor::AsSecurityDescriptorExt;

        const LABEL_SECURITY_INFORMATION: u32 = 0x10;
        let sddl = only_for(&current_user().unwrap())
            .unwrap()
            .serialize(LABEL_SECURITY_INFORMATION, |s| s.to_string_lossy())
            .unwrap();
        assert!(sddl.contains("ML;;NWNRNX;;;ME"), "{sddl}");
    }

    #[test]
    fn a_labelled_pipe_can_be_created_and_joined_by_its_owner() {
        use interprocess::local_socket::{
            prelude::*, GenericNamespaced, ListenerOptions, Stream, ToNsName,
        };
        use interprocess::os::windows::local_socket::ListenerOptionsExt;

        let own = current_user().unwrap();
        let name = format!("deatch-test-{}", std::process::id());
        let listener = ListenerOptions::new()
            .name(name.clone().to_ns_name::<GenericNamespaced>().unwrap())
            .security_descriptor(only_for(&own).unwrap())
            .create_sync()
            .unwrap();
        let client = std::thread::spawn(move || {
            Stream::connect(name.to_ns_name::<GenericNamespaced>().unwrap()).is_ok()
        });
        assert!(listener.accept().is_ok());
        assert!(client.join().unwrap());
    }

    #[test]
    fn pipe_access_is_limited_to_the_current_user() {
        use interprocess::os::windows::security_descriptor::AsSecurityDescriptorExt;

        let sddl = only_for(&current_user().unwrap())
            .unwrap()
            .serialize(4, |s| s.to_string_lossy())
            .unwrap();
        let trustee = sddl
            .strip_prefix("D:P(A;;GA;;;")
            .and_then(|rest| rest.strip_suffix(')'))
            .unwrap_or_else(|| panic!("{sddl}"));
        let builtin_accounts = ["LA", "LG"];
        assert!(
            trustee.starts_with("S-1-5-21-") || builtin_accounts.contains(&trustee),
            "{sddl}"
        );
        assert_eq!(sddl.matches("(A;").count(), 1, "{sddl}");
    }

    fn lines(input: &[u8]) -> Vec<std::io::Result<Option<String>>> {
        let mut reader = input;
        tauri::async_runtime::block_on(async {
            let mut out = Vec::new();
            loop {
                let line = read_line(&mut reader).await;
                let done = !matches!(line, Ok(Some(_)));
                out.push(line);
                if done {
                    return out;
                }
            }
        })
    }

    #[test]
    fn without_a_browser_only_send_fails() {
        let hosts = Hosts::default();
        tauri::async_runtime::block_on(async {
            let err = hosts.send(&HostCommand::GetState).await.unwrap_err();
            assert_eq!(err.kind(), std::io::ErrorKind::NotConnected);
            assert!(!hosts
                .send_if_connected(&HostCommand::GetState)
                .await
                .unwrap());
        });
    }

    #[test]
    fn reads_lines_until_the_pipe_closes() {
        let read = lines(b"one\r\ntwo\n");
        assert_eq!(read[0].as_ref().unwrap().as_deref(), Some("one"));
        assert_eq!(read[1].as_ref().unwrap().as_deref(), Some("two"));
        assert!(matches!(read[2], Ok(None)));
    }

    #[test]
    fn rejects_a_line_longer_than_the_message_limit() {
        let long = vec![b'x'; MAX_MESSAGE_SIZE + 1];
        assert!(lines(&long)[0].is_err());
    }

    fn state(channels: &[(&str, bool)], current: Option<&str>) -> LinkState {
        LinkState {
            channels: channels
                .iter()
                .map(|(login, muted)| LinkChannel {
                    login: login.to_string(),
                    muted: *muted,
                })
                .collect(),
            current: current.map(str::to_string),
            ..LinkState::default()
        }
    }

    #[test]
    fn merge_unions_channels_and_lets_the_latest_browser_pick_current() {
        let firefox = state(
            &[("broadcaster3", true), ("broadcaster2", false)],
            Some("broadcaster3"),
        );
        let chrome = state(
            &[("broadcaster3", false), ("broadcaster1", true)],
            Some("broadcaster1"),
        );
        let merged = merge([(2, &firefox), (1, &chrome)].into_iter());
        assert_eq!(
            serde_json::to_value(&merged).unwrap(),
            json!({
                "channels": [
                    { "login": "broadcaster1", "muted": true },
                    { "login": "broadcaster2", "muted": false },
                    { "login": "broadcaster3", "muted": false },
                ],
                "current": "broadcaster3",
                "audio": false,
                "gains": null,
                "balances": null,
                "bonusReady": [],
                "subscribed": null,
                "drops": null,
                "earnedAt": null,
                "compressorOn": null,
                "rewards": null,
            })
        );
    }

    #[test]
    fn merge_offers_audio_when_any_browser_supports_it() {
        let old = state(&[], None);
        let new = LinkState {
            audio: true,
            ..state(&[], None)
        };
        assert!(merge([(1, &old), (2, &new)].into_iter()).audio);
        assert!(!merge([(1, &old)].into_iter()).audio);
    }

    #[test]
    fn merge_combines_volumes_and_keeps_none_for_old_extensions() {
        let old = state(&[], None);
        let firefox = LinkState {
            gains: Some([("broadcaster1".to_string(), 1.5)].into()),
            ..state(&[], None)
        };
        let chrome = LinkState {
            gains: Some([("broadcaster2".to_string(), 0.5)].into()),
            ..state(&[], None)
        };
        let merged = merge([(1, &old), (2, &firefox), (3, &chrome)].into_iter());
        assert_eq!(
            serde_json::to_value(merged.gains).unwrap(),
            json!({ "broadcaster1": 1.5, "broadcaster2": 0.5 })
        );
        assert!(merge([(1, &old)].into_iter()).gains.is_none());
    }

    #[test]
    fn merge_reports_the_compressor_on_when_any_browser_has_it_on() {
        let off = LinkState {
            compressor_on: Some(false),
            ..state(&[], None)
        };
        let on = LinkState {
            compressor_on: Some(true),
            ..state(&[], None)
        };
        let old = state(&[], None);
        assert_eq!(
            merge([(1, &off), (2, &on)].into_iter()).compressor_on,
            Some(true)
        );
        assert_eq!(
            merge([(1, &off), (2, &old)].into_iter()).compressor_on,
            Some(false)
        );
        assert_eq!(merge([(1, &old)].into_iter()).compressor_on, None);
    }

    #[test]
    fn merge_keeps_the_latest_earning_time_per_channel() {
        let firefox = LinkState {
            earned_at: Some(
                [
                    ("1".to_string(), "2026-11-26T19:13:04.97Z".to_string()),
                    ("2".to_string(), "2026-11-26T19:00:00Z".to_string()),
                ]
                .into(),
            ),
            ..state(&[], None)
        };
        let chrome = LinkState {
            earned_at: Some(
                [
                    ("1".to_string(), "2026-11-26T19:05:00Z".to_string()),
                    ("2".to_string(), "2026-11-26T19:10:00Z".to_string()),
                ]
                .into(),
            ),
            ..state(&[], None)
        };
        let merged = merge([(1, &firefox), (2, &chrome)].into_iter());
        assert_eq!(
            serde_json::to_value(merged.earned_at).unwrap(),
            json!({ "1": "2026-11-26T19:13:04.97Z", "2": "2026-11-26T19:10:00Z" })
        );
    }

    #[test]
    fn merge_combines_subscriptions() {
        let firefox = LinkState {
            subscribed: Some([("broadcaster1".to_string(), true)].into()),
            ..state(&[], None)
        };
        let chrome = LinkState {
            subscribed: Some([("broadcaster2".to_string(), false)].into()),
            ..state(&[], None)
        };
        let merged = merge([(1, &firefox), (2, &chrome)].into_iter());
        assert_eq!(
            serde_json::to_value(merged.subscribed).unwrap(),
            json!({ "broadcaster1": true, "broadcaster2": false })
        );
    }

    #[test]
    fn merge_combines_channel_points() {
        let firefox = LinkState {
            balances: Some([("broadcaster1".to_string(), 2630)].into()),
            ..state(&[], None)
        };
        let chrome = LinkState {
            balances: Some([("broadcaster2".to_string(), 50)].into()),
            ..state(&[], None)
        };
        let merged = merge([(1, &firefox), (2, &chrome)].into_iter());
        assert_eq!(
            serde_json::to_value(merged.balances).unwrap(),
            json!({ "broadcaster1": 2630, "broadcaster2": 50 })
        );
        assert!(merge([(1, &state(&[], None))].into_iter())
            .balances
            .is_none());
    }

    #[test]
    fn merge_lists_each_bonus_ready_channel_once() {
        let ready = |logins: &[&str]| LinkState {
            bonus_ready: logins.iter().map(|l| l.to_string()).collect(),
            ..state(&[], None)
        };
        let merged = merge(
            [
                (1, &ready(&["broadcaster2", "broadcaster1"])),
                (2, &ready(&["broadcaster1"])),
            ]
            .into_iter(),
        );
        assert_eq!(merged.bonus_ready, ["broadcaster1", "broadcaster2"]);
    }

    #[test]
    fn a_reward_with_an_unknown_status_is_skipped_not_the_whole_state() {
        let message = serde_json::from_value::<HostMessage>(json!({
            "type": "state",
            "channels": [{ "login": "broadcaster1", "muted": false }],
            "current": "broadcaster1",
            "rewards": { "broadcaster1": [
                { "id": "r1", "title": "Hydrate", "cost": 100, "status": "available" },
                { "id": "r2", "title": "Future", "cost": 100, "status": "on_fire" },
            ] },
        }));
        let Ok(HostMessage::State(state)) = message else {
            panic!("state was rejected");
        };
        let rewards = state.rewards.unwrap_or_default();
        let ids: Vec<&str> = rewards["broadcaster1"]
            .iter()
            .map(|r| r.id.as_str())
            .collect();
        assert_eq!(ids, ["r1"]);
    }

    #[test]
    fn reads_redeem_results() {
        let failed = serde_json::from_value::<HostMessage>(
            json!({ "type": "redeemed", "request": "request1", "error": "COOLDOWN" }),
        );
        assert!(matches!(
            failed,
            Ok(HostMessage::Redeemed(LinkAnswer { ref request, error: Some(ref code) }))
                if request == "request1" && code == "COOLDOWN"
        ));
        let done = serde_json::from_value::<HostMessage>(
            json!({ "type": "redeemed", "request": "request1", "error": null }),
        );
        assert!(matches!(
            done,
            Ok(HostMessage::Redeemed(LinkAnswer { error: None, .. }))
        ));
    }

    #[test]
    fn reads_state_from_extensions_without_audio() {
        let state: LinkState =
            serde_json::from_value(json!({ "channels": [], "current": null })).unwrap();
        assert!(!state.audio);
    }

    #[test]
    fn merge_falls_back_to_any_browser_with_a_current_channel() {
        let idle = state(&[("broadcaster3", false)], None);
        let linking = state(&[("broadcaster1", false)], Some("broadcaster1"));
        let merged = merge([(5, &idle), (1, &linking)].into_iter());
        assert_eq!(merged.current.as_deref(), Some("broadcaster1"));
    }

    #[test]
    fn host_commands_match_the_extension_protocol() {
        let channel = || "broadcaster3".to_string();
        let wire = |c: HostCommand| serde_json::to_value(c).unwrap();
        assert_eq!(
            wire(HostCommand::SetMuted {
                channel: channel(),
                muted: true
            }),
            json!({ "type": "set_muted", "channel": "broadcaster3", "muted": true })
        );
        assert_eq!(
            wire(HostCommand::Focus { channel: channel() }),
            json!({ "type": "focus", "channel": "broadcaster3" })
        );
        assert_eq!(
            wire(HostCommand::Close { channel: channel() }),
            json!({ "type": "close", "channel": "broadcaster3" })
        );
        assert_eq!(
            wire(HostCommand::SetGain {
                channel: channel(),
                gain: 1.5
            }),
            json!({ "type": "set_gain", "channel": "broadcaster3", "gain": 1.5 })
        );
        assert_eq!(
            wire(HostCommand::ClaimBonus { channel: channel() }),
            json!({ "type": "claim_bonus", "channel": "broadcaster3" })
        );
        assert_eq!(
            wire(HostCommand::Redeem {
                channel: channel(),
                reward: "reward1".to_string(),
                cost: 100,
                text: None,
                request: "request1".to_string(),
            }),
            json!({
                "type": "redeem",
                "channel": "broadcaster3",
                "reward": "reward1",
                "cost": 100,
                "text": null,
                "request": "request1",
            })
        );
        assert_eq!(
            wire(HostCommand::ClaimDrops {
                channel: channel(),
                request: "request1".to_string(),
            }),
            json!({
                "type": "claim_drops",
                "channel": "broadcaster3",
                "request": "request1",
            })
        );
        assert_eq!(
            wire(HostCommand::SetCompressor { on: true }),
            json!({ "type": "set_compressor", "on": true })
        );
        assert_eq!(wire(HostCommand::GetState), json!({ "type": "get_state" }));
    }

    #[test]
    fn reads_drop_claim_answers() {
        let answer = serde_json::from_value::<HostMessage>(
            json!({ "type": "drops_claimed", "request": "request1", "error": "NOT_FOUND" }),
        );
        assert!(matches!(
            answer,
            Ok(HostMessage::DropsClaimed(LinkAnswer { ref request, error: Some(ref code) }))
                if request == "request1" && code == "NOT_FOUND"
        ));
    }
}
