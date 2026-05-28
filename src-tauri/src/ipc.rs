use std::sync::OnceLock;

const PIPE_NAME: &str = "deatch-bridge";

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

pub async fn send_to_host(line: &str) -> std::io::Result<()> {
    use tokio::io::AsyncWriteExt;
    let mut slot = writer_slot().lock().await;
    let Some(writer) = slot.as_mut() else {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotConnected,
            "host not connected",
        ));
    };
    let payload = format!("{line}\n");
    if let Err(e) = writer.write_all(payload.as_bytes()).await {
        *slot = None;
        return Err(e);
    }
    if let Err(e) = writer.flush().await {
        *slot = None;
        return Err(e);
    }
    Ok(())
}

pub fn start_server(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        if let Err(e) = run_server(app).await {
            eprintln!("ipc server stopped: {e}");
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
        let conn = match listener.accept().await {
            Ok(c) => c,
            Err(e) => {
                eprintln!("ipc accept failed: {e}");
                continue;
            }
        };
        handle_connection(app.clone(), conn).await;
    }
}

async fn handle_connection(
    app: tauri::AppHandle,
    conn: interprocess::local_socket::tokio::Stream,
) {
    use tauri::Emitter;
    use tokio::io::AsyncBufReadExt;

    let (read_half, write_half) = tokio::io::split(conn);
    {
        let mut slot = writer_slot().lock().await;
        *slot = Some(write_half);
    }

    let mut lines = tokio::io::BufReader::new(read_half).lines();
    while let Ok(Some(line)) = lines.next_line().await {
        let payload: serde_json::Value = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(e) => {
                eprintln!("ipc bad json: {e} — {line}");
                continue;
            }
        };
        let event = match payload.get("type").and_then(|v| v.as_str()) {
            Some("state") => "watch:state",
            other => {
                eprintln!("ipc unknown type: {other:?}");
                continue;
            }
        };
        let _ = app.emit(event, payload);
    }

    {
        let mut slot = writer_slot().lock().await;
        *slot = None;
    }
    let _ = app.emit("watch:disconnected", ());
}
