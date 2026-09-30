use super::events::{WatchDisconnected, WatchState};
use crate::emit::emit;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

const PIPE_NAME: &str = "deatch-bridge";

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum HostCommand<'a> {
    SetMuted { channel: &'a str, muted: bool },
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

static HOST_WRITER: OnceLock<tokio::sync::Mutex<Option<HostWriter>>> = OnceLock::new();

fn writer_slot() -> &'static tokio::sync::Mutex<Option<HostWriter>> {
    HOST_WRITER.get_or_init(|| tokio::sync::Mutex::new(None))
}

pub async fn set_muted(channel: &str, muted: bool) -> std::io::Result<()> {
    let channel = channel.to_lowercase();
    send_to_host(&HostCommand::SetMuted {
        channel: &channel,
        muted,
    })
    .await
}

pub async fn request_state() -> std::io::Result<()> {
    send_to_host(&HostCommand::GetState).await
}

async fn send_to_host(command: &HostCommand<'_>) -> std::io::Result<()> {
    use tokio::io::AsyncWriteExt;
    let mut slot = writer_slot().lock().await;
    let Some(writer) = slot.as_mut() else {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotConnected,
            "host not connected",
        ));
    };
    let mut payload = serde_json::to_vec(command)?;
    payload.push(b'\n');
    if let Err(e) = writer.write_all(&payload).await {
        *slot = None;
        return Err(e);
    }
    if let Err(e) = writer.flush().await {
        *slot = None;
        return Err(e);
    }
    Ok(())
}

pub fn start_server(app: tauri::AppHandle) -> tauri::async_runtime::JoinHandle<()> {
    tauri::async_runtime::spawn(async move {
        if let Err(e) = run_server(app).await {
            log::error!("ipc server stopped: {e}");
        }
    })
}

async fn run_server(app: tauri::AppHandle) -> std::io::Result<()> {
    use interprocess::local_socket::{
        tokio::prelude::*, GenericNamespaced, ListenerOptions, ToNsName,
    };

    let name = PIPE_NAME.to_ns_name::<GenericNamespaced>()?;
    let listener = ListenerOptions::new().name(name).create_tokio()?;

    loop {
        let conn = match listener.accept().await {
            Ok(c) => c,
            Err(e) => {
                log::warn!("ipc accept failed: {e}");
                continue;
            }
        };
        handle_connection(&app, conn).await;
    }
}

async fn handle_connection(
    app: &tauri::AppHandle,
    conn: interprocess::local_socket::tokio::Stream,
) {
    use tokio::io::AsyncBufReadExt;

    let (read_half, write_half) = tokio::io::split(conn);
    *writer_slot().lock().await = Some(write_half);

    let mut lines = tokio::io::BufReader::new(read_half).lines();
    while let Ok(Some(line)) = lines.next_line().await {
        match serde_json::from_str::<HostMessage>(&line) {
            Ok(HostMessage::State(state)) => emit(app, state),
            Err(e) => log::warn!("ipc bad message: {e} — {line}"),
        }
    }

    *writer_slot().lock().await = None;
    emit(app, WatchDisconnected);
}
