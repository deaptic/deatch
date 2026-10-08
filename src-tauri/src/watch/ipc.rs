use super::events::{WatchDisconnected, WatchState};
use crate::emit::emit;
use serde::{Deserialize, Serialize};
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

/// The newest host wins; the id lets an older connection's teardown leave
/// the newer writer alone.
static HOST_WRITER: tokio::sync::Mutex<Option<(u64, HostWriter)>> =
    tokio::sync::Mutex::const_new(None);
static NEXT_CONNECTION: AtomicU64 = AtomicU64::new(0);

pub async fn send_to_host(command: &HostCommand) -> std::io::Result<()> {
    use tokio::io::AsyncWriteExt;
    let mut slot = HOST_WRITER.lock().await;
    let Some((_, writer)) = slot.as_mut() else {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotConnected,
            "host not connected",
        ));
    };
    let mut payload = serde_json::to_vec(command)?;
    payload.push(b'\n');
    let result = async {
        writer.write_all(&payload).await?;
        writer.flush().await
    }
    .await;
    if result.is_err() {
        *slot = None;
    }
    result
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

    let id = NEXT_CONNECTION.fetch_add(1, Ordering::Relaxed);
    let (read_half, write_half) = tokio::io::split(conn);
    *HOST_WRITER.lock().await = Some((id, write_half));

    let mut lines = tokio::io::BufReader::new(read_half).lines();
    while let Ok(Some(line)) = lines.next_line().await {
        match serde_json::from_str::<HostMessage>(&line) {
            Ok(HostMessage::State(state)) => emit(&app, state),
            Err(e) => log::warn!("ipc bad message: {e} — {line}"),
        }
    }

    let mut slot = HOST_WRITER.lock().await;
    if slot.as_ref().is_some_and(|(current, _)| *current == id) {
        *slot = None;
        emit(&app, WatchDisconnected);
    }
}

#[cfg(test)]
mod tests {
    use super::HostCommand;
    use serde_json::json;

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
