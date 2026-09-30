pub mod commands;
mod dispatch;
mod envelope;
mod kind;
mod runner;
mod subscribe;

pub use kind::EventKind;

use super::Twitch;
use crate::error::{Error, Result};
use tauri::Manager;

pub(super) const WS_URL: &str = "wss://eventsub.wss.twitch.tv/ws";

pub enum EventSubCmd {
    Subscribe {
        broadcaster_id: String,
        kind: EventKind,
    },
    Unsubscribe {
        broadcaster_id: String,
        kind: EventKind,
    },
}

pub async fn subscribe(
    app: &tauri::AppHandle,
    broadcaster_id: String,
    kind: EventKind,
) -> Result<()> {
    runner::ensure_task(app).await?;
    send_cmd(
        app,
        EventSubCmd::Subscribe {
            broadcaster_id,
            kind,
        },
    )
}

pub async fn unsubscribe(
    app: &tauri::AppHandle,
    broadcaster_id: String,
    kind: EventKind,
) -> Result<()> {
    send_cmd(
        app,
        EventSubCmd::Unsubscribe {
            broadcaster_id,
            kind,
        },
    )
}

fn send_cmd(app: &tauri::AppHandle, cmd: EventSubCmd) -> Result<()> {
    let twitch = app.state::<Twitch>();
    let tx_guard = twitch.eventsub_tx.lock().unwrap();
    if let Some(tx) = tx_guard.as_ref() {
        tx.send(cmd)
            .map_err(|_| Error::Io("eventsub task stopped".into()))?;
    }
    Ok(())
}
