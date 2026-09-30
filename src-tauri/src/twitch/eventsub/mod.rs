pub mod commands;
mod dispatch;
mod envelope;
pub mod events;
mod kind;
mod runner;
mod subscribe;

pub use kind::EventKind;

use super::Twitch;
use crate::error::{Error, Result};
use std::sync::Mutex;
use tokio::sync::mpsc;

const WS_URL: &str = "wss://eventsub.wss.twitch.tv/ws";

enum EventSubCmd {
    Subscribe {
        broadcaster_id: String,
        kind: EventKind,
    },
    Unsubscribe {
        broadcaster_id: String,
        kind: EventKind,
    },
}

#[derive(Default)]
pub struct Handle {
    tx: Mutex<Option<mpsc::UnboundedSender<EventSubCmd>>>,
    /// Serializes `runner::ensure_task` so concurrent `subscribe` calls
    /// can't race the auth check or spawn duplicate tasks.
    init: tokio::sync::Mutex<()>,
}

impl Handle {
    pub(crate) fn stop(&self) {
        *self.tx.lock().unwrap() = None;
    }

    fn send(&self, cmd: EventSubCmd) -> Result<()> {
        if let Some(tx) = self.tx.lock().unwrap().as_ref() {
            tx.send(cmd)
                .map_err(|_| Error::Io("eventsub task stopped".into()))?;
        }
        Ok(())
    }
}

pub async fn subscribe(
    app: &tauri::AppHandle,
    twitch: &Twitch,
    broadcaster_id: String,
    kind: EventKind,
) -> Result<()> {
    runner::ensure_task(app, twitch).await?;
    twitch.eventsub.send(EventSubCmd::Subscribe {
        broadcaster_id,
        kind,
    })
}

pub fn unsubscribe(twitch: &Twitch, broadcaster_id: String, kind: EventKind) -> Result<()> {
    twitch.eventsub.send(EventSubCmd::Unsubscribe {
        broadcaster_id,
        kind,
    })
}
