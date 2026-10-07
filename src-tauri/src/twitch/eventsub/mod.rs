pub mod commands;
mod connection;
pub mod events;
mod helix;
mod kind;
mod runner;
mod subscriptions;

pub use kind::{EventKind, Focus};

use super::ids::UserId;
use super::Twitch;
use crate::error::{Error, Result};
use serde::Deserialize;
use std::sync::Mutex;
use subscriptions::Channels;
use tokio::sync::mpsc;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ChannelFocus {
    pub broadcaster_id: UserId,
    pub focus: Focus,
}

pub struct Handle {
    tx: mpsc::UnboundedSender<Channels>,
    rx: Mutex<Option<mpsc::UnboundedReceiver<Channels>>>,
}

impl Default for Handle {
    fn default() -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        Self {
            tx,
            rx: Mutex::new(Some(rx)),
        }
    }
}

impl Handle {
    pub(crate) fn clear(&self) {
        if self.send(Channels::new()).is_err() {
            log::warn!("eventsub task stopped, could not clear channels");
        }
    }

    fn send(&self, channels: Channels) -> Result<()> {
        self.tx
            .send(channels)
            .map_err(|_| Error::Io("eventsub task stopped".into()))
    }
}

pub fn spawn(app: tauri::AppHandle, twitch: Twitch) {
    let Some(rx) = twitch.eventsub.rx.lock().unwrap().take() else {
        log::error!("eventsub task already started");
        return;
    };
    tauri::async_runtime::spawn(async move { runner::run(&app, &twitch, rx).await });
}

pub fn set_channels(twitch: &Twitch, channels: Vec<ChannelFocus>) -> Result<()> {
    twitch.eventsub.send(
        channels
            .into_iter()
            .map(|c| (c.broadcaster_id, c.focus))
            .collect(),
    )
}
