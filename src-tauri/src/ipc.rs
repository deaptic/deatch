// Local-socket IPC: browser-host process → running GUI. One-way for now.
// Messages are newline-delimited JSON.

const PIPE_NAME: &str = "deatch-bridge";

// ---- host side (sync, called from browser_host::run) ----

pub struct Sink {
    stream: Option<interprocess::local_socket::Stream>,
}

impl Sink {
    pub fn new() -> Self {
        Self { stream: None }
    }

    pub fn forward(&mut self, line: &str) -> std::io::Result<()> {
        use interprocess::local_socket::{prelude::*, GenericNamespaced, Stream, ToNsName};
        use std::io::Write;

        if self.stream.is_none() {
            let name = PIPE_NAME.to_ns_name::<GenericNamespaced>()?;
            self.stream = Some(Stream::connect(name)?);
        }
        let stream = self.stream.as_mut().unwrap();

        if let Err(e) = writeln!(stream, "{line}").and_then(|_| stream.flush()) {
            self.stream = None; // next forward() reconnects
            return Err(e);
        }
        Ok(())
    }
}

// ---- GUI side (async, spawned from Tauri setup hook) ----

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
        let app = app.clone();
        tauri::async_runtime::spawn(async move {
            handle_connection(app, conn).await;
        });
    }
}

async fn handle_connection(
    app: tauri::AppHandle,
    conn: interprocess::local_socket::tokio::Stream,
) {
    use tauri::Emitter;
    use tokio::io::AsyncBufReadExt;

    let mut lines = tokio::io::BufReader::new(conn).lines();
    while let Ok(Some(line)) = lines.next_line().await {
        let payload: serde_json::Value = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(e) => {
                eprintln!("ipc bad json: {e} — {line}");
                continue;
            }
        };
        let event = match payload.get("type").and_then(|v| v.as_str()) {
            Some("channel_switched") => "watch:channel_switched",
            Some("hello") => "watch:hello",
            Some("sync") => "watch:sync",
            other => {
                eprintln!("ipc unknown type: {other:?}");
                continue;
            }
        };
        let _ = app.emit(event, payload);
    }
    let _ = app.emit("watch:disconnected", ());
}
