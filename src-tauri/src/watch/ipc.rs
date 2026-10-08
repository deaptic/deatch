use super::events::{WatchChannel, WatchDisconnected, WatchState};
use crate::emit::emit;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

const PIPE_NAME: &str = "deatch-bridge";
const ACCEPT_RETRY: Duration = Duration::from_secs(1);

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum HostCommand {
    SetMuted { channel: String, muted: bool },
    Focus { channel: String },
    Close { channel: String },
    GetState,
}

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum HostMessage {
    State(WatchState),
}

pub fn connect_to_gui() -> std::io::Result<interprocess::local_socket::Stream> {
    use interprocess::local_socket::{prelude::*, GenericNamespaced, Stream, ToNsName};
    let name = PIPE_NAME.to_ns_name::<GenericNamespaced>()?;
    Stream::connect(name)
}

type HostWriter = tokio::io::WriteHalf<interprocess::local_socket::tokio::Stream>;

/// One entry per connected browser. `reported_at` orders the states so the
/// browser that spoke last decides `current`.
struct Host {
    writer: HostWriter,
    state: WatchState,
    reported_at: u64,
}

static HOSTS: tokio::sync::Mutex<BTreeMap<u64, Host>> =
    tokio::sync::Mutex::const_new(BTreeMap::new());
static NEXT_ID: AtomicU64 = AtomicU64::new(0);

/// Every browser gets every command; the extension ignores channels it has no
/// tab for.
pub async fn send_to_host(command: &HostCommand) -> std::io::Result<()> {
    use tokio::io::AsyncWriteExt;
    let mut hosts = HOSTS.lock().await;
    if hosts.is_empty() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotConnected,
            "host not connected",
        ));
    }
    let mut payload = serde_json::to_vec(command)?;
    payload.push(b'\n');
    for host in hosts.values_mut() {
        if let Err(e) = host.writer.write_all(&payload).await {
            log::warn!("ipc write failed: {e}");
        }
    }
    Ok(())
}

/// A channel open in several browsers is muted only when every tab is.
fn merge<'a>(states: impl Iterator<Item = (u64, &'a WatchState)>) -> WatchState {
    let mut channels: BTreeMap<&str, bool> = BTreeMap::new();
    let mut current: Option<(u64, &str)> = None;
    for (reported_at, state) in states {
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
    WatchState {
        channels: channels
            .into_iter()
            .map(|(login, muted)| WatchChannel {
                login: login.to_string(),
                muted,
            })
            .collect(),
        current: current.map(|(_, login)| login.to_string()),
    }
}

fn emit_merged(app: &tauri::AppHandle, hosts: &BTreeMap<u64, Host>) {
    if hosts.is_empty() {
        emit(app, WatchDisconnected);
    } else {
        emit(
            app,
            merge(hosts.values().map(|h| (h.reported_at, &h.state))),
        );
    }
}

pub fn start_server(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        if let Err(e) = run_server(app).await {
            log::error!("ipc server stopped: {e}");
        }
    });
}

async fn run_server(app: tauri::AppHandle) -> std::io::Result<()> {
    use interprocess::local_socket::{
        tokio::prelude::*, GenericNamespaced, ListenerOptions, ToNsName,
    };

    let name = PIPE_NAME.to_ns_name::<GenericNamespaced>()?;
    let listener = ListenerOptions::new().name(name).create_tokio()?;

    loop {
        match listener.accept().await {
            Ok(conn) => {
                tauri::async_runtime::spawn(handle_connection(app.clone(), conn));
            }
            Err(e) => {
                log::warn!("ipc accept failed: {e}");
                tokio::time::sleep(ACCEPT_RETRY).await;
            }
        }
    }
}

async fn handle_connection(app: tauri::AppHandle, conn: interprocess::local_socket::tokio::Stream) {
    use tokio::io::AsyncBufReadExt;

    let id = NEXT_ID.fetch_add(1, Ordering::Relaxed);
    let (read_half, writer) = tokio::io::split(conn);
    HOSTS.lock().await.insert(
        id,
        Host {
            writer,
            state: WatchState {
                channels: Vec::new(),
                current: None,
            },
            reported_at: 0,
        },
    );

    let mut lines = tokio::io::BufReader::new(read_half).lines();
    while let Ok(Some(line)) = lines.next_line().await {
        match serde_json::from_str::<HostMessage>(&line) {
            Ok(HostMessage::State(state)) => {
                let mut hosts = HOSTS.lock().await;
                if let Some(host) = hosts.get_mut(&id) {
                    host.state = state;
                    host.reported_at = NEXT_ID.fetch_add(1, Ordering::Relaxed);
                }
                emit_merged(&app, &hosts);
            }
            Err(e) => log::warn!("ipc bad message: {e} — {line}"),
        }
    }

    let mut hosts = HOSTS.lock().await;
    hosts.remove(&id);
    emit_merged(&app, &hosts);
}

#[cfg(test)]
mod tests {
    use super::{merge, HostCommand, WatchChannel, WatchState};
    use serde_json::json;

    fn state(channels: &[(&str, bool)], current: Option<&str>) -> WatchState {
        WatchState {
            channels: channels
                .iter()
                .map(|(login, muted)| WatchChannel {
                    login: login.to_string(),
                    muted: *muted,
                })
                .collect(),
            current: current.map(str::to_string),
        }
    }

    #[test]
    fn merge_unions_channels_and_lets_the_latest_browser_pick_current() {
        let firefox = state(&[("xqc", true), ("pokimane", false)], Some("xqc"));
        let chrome = state(&[("xqc", false), ("forsen", true)], Some("forsen"));
        let merged = merge([(2, &firefox), (1, &chrome)].into_iter());
        assert_eq!(
            serde_json::to_value(&merged).unwrap(),
            json!({
                "channels": [
                    { "login": "forsen", "muted": true },
                    { "login": "pokimane", "muted": false },
                    { "login": "xqc", "muted": false },
                ],
                "current": "xqc",
            })
        );
    }

    #[test]
    fn merge_falls_back_to_any_browser_with_a_current_channel() {
        let idle = state(&[("xqc", false)], None);
        let watching = state(&[("forsen", false)], Some("forsen"));
        let merged = merge([(5, &idle), (1, &watching)].into_iter());
        assert_eq!(merged.current.as_deref(), Some("forsen"));
    }

    #[test]
    fn host_commands_match_the_extension_protocol() {
        let channel = || "xqc".to_string();
        let wire = |c: HostCommand| serde_json::to_value(c).unwrap();
        assert_eq!(
            wire(HostCommand::SetMuted {
                channel: channel(),
                muted: true
            }),
            json!({ "type": "set_muted", "channel": "xqc", "muted": true })
        );
        assert_eq!(
            wire(HostCommand::Focus { channel: channel() }),
            json!({ "type": "focus", "channel": "xqc" })
        );
        assert_eq!(
            wire(HostCommand::Close { channel: channel() }),
            json!({ "type": "close", "channel": "xqc" })
        );
        assert_eq!(wire(HostCommand::GetState), json!({ "type": "get_state" }));
    }
}
