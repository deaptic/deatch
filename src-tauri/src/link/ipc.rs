use super::events::{LinkChannel, LinkDisconnected, LinkState};
use super::MAX_MESSAGE_SIZE;
use crate::emit::emit;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::sync::Arc;
use std::time::Duration;

const PIPE_NAME: &str = "deatch-bridge";
const ACCEPT_RETRY: Duration = Duration::from_secs(1);
/// `Hosts::send` holds the hosts lock while writing, so a browser that stops
/// reading its pipe must not block every other browser forever.
const WRITE_TIMEOUT: Duration = Duration::from_secs(2);

/// The compressor's controls as the listener sets them: threshold and gain in
/// dB, ratio as N:1, attack and release in milliseconds. The extension clamps
/// each to its range.
#[derive(Clone, Serialize, Deserialize, specta::Type)]
pub struct Compressor {
    pub threshold: f64,
    pub ratio: f64,
    pub attack: f64,
    pub release: f64,
    pub gain: f64,
}

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
    SetAudio {
        enabled: bool,
        compressor: Compressor,
        gains: BTreeMap<String, f64>,
    },
    GetState,
}

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum HostMessage {
    State(LinkState),
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
    state: LinkState,
    reported_at: u64,
    /// Dropped with the host, which ends its reader task and closes the pipe.
    _close: tokio::sync::oneshot::Sender<()>,
}

#[derive(Default)]
struct Connected {
    hosts: BTreeMap<u64, Host>,
    next_id: u64,
    reports: u64,
    /// The last `set_audio`, replayed to each browser as it connects.
    audio: Option<Vec<u8>>,
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
    /// Writes to every browser, dropping any that stopped reading.
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
    /// Every browser gets every command; the extension ignores channels it has
    /// no tab for.
    pub async fn send(&self, command: &HostCommand) -> std::io::Result<()> {
        let mut connected = self.0.lock().await;
        if connected.hosts.is_empty() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotConnected,
                "host not connected",
            ));
        }
        connected.broadcast(&encode(command)?).await;
        Ok(())
    }

    /// Audio settings outlive connections: they are kept and replayed to each
    /// browser as it connects, so one that connects later gets them too.
    pub async fn set_audio(
        &self,
        enabled: bool,
        compressor: Compressor,
        gains: BTreeMap<String, f64>,
    ) -> std::io::Result<()> {
        let payload = encode(&HostCommand::SetAudio {
            enabled,
            compressor,
            gains,
        })?;
        let mut connected = self.0.lock().await;
        connected.broadcast(&payload).await;
        connected.audio = Some(payload);
        Ok(())
    }
}

/// A channel open in several browsers is muted only when every tab is, and
/// audio processing is offered when any browser can do it.
fn merge<'a>(states: impl Iterator<Item = (u64, &'a LinkState)>) -> LinkState {
    let mut channels: BTreeMap<&str, bool> = BTreeMap::new();
    let mut current: Option<(u64, &str)> = None;
    let mut audio = false;
    for (reported_at, state) in states {
        audio |= state.audio;
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
        if let Err(e) = run_server(app, hosts).await {
            log::error!("ipc server stopped: {e}");
        }
    });
}

async fn run_server(app: tauri::AppHandle, hosts: Hosts) -> std::io::Result<()> {
    use interprocess::local_socket::{
        tokio::prelude::*, GenericNamespaced, ListenerOptions, ToNsName,
    };

    let name = PIPE_NAME.to_ns_name::<GenericNamespaced>()?;
    let listener = ListenerOptions::new().name(name).create_tokio()?;

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
    let (read_half, mut writer) = tokio::io::split(conn);
    let (close, mut closed) = tokio::sync::oneshot::channel();
    let id = {
        let mut connected = hosts.0.lock().await;
        if let Some(audio) = &connected.audio {
            write(&mut writer, audio).await;
        }
        let id = connected.next_id;
        connected.next_id += 1;
        connected.hosts.insert(
            id,
            Host {
                writer,
                state: LinkState {
                    channels: Vec::new(),
                    current: None,
                    audio: false,
                },
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
                    host.state = state;
                    host.reported_at = reported_at;
                }
                emit_merged(&app, &connected.hosts);
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
        merge, read_line, Compressor, HostCommand, LinkChannel, LinkState, MAX_MESSAGE_SIZE,
    };
    use serde_json::json;

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
            audio: false,
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
                "audio": false,
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
    fn reads_state_from_extensions_without_audio() {
        let state: LinkState =
            serde_json::from_value(json!({ "channels": [], "current": null })).unwrap();
        assert!(!state.audio);
    }

    #[test]
    fn merge_falls_back_to_any_browser_with_a_current_channel() {
        let idle = state(&[("xqc", false)], None);
        let linking = state(&[("forsen", false)], Some("forsen"));
        let merged = merge([(5, &idle), (1, &linking)].into_iter());
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
        assert_eq!(
            wire(HostCommand::SetAudio {
                enabled: true,
                compressor: Compressor {
                    threshold: -27.0,
                    ratio: 3.2,
                    attack: 10.0,
                    release: 250.0,
                    gain: 0.0,
                },
                gains: [("xqc".to_string(), 1.5)].into(),
            }),
            json!({
                "type": "set_audio",
                "enabled": true,
                "compressor": {
                    "threshold": -27.0, "ratio": 3.2, "attack": 10.0,
                    "release": 250.0, "gain": 0.0,
                },
                "gains": { "xqc": 1.5 },
            })
        );
        assert_eq!(wire(HostCommand::GetState), json!({ "type": "get_state" }));
    }
}
