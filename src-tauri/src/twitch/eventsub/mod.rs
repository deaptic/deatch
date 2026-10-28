pub mod commands;
mod connection;
pub mod dto;
pub mod events;
mod helix;
mod kind;
mod runner;
mod subscriptions;
mod versions;

pub use kind::{EventKind, Focus};

use super::ids::UserId;
use super::Twitch;
use crate::error::Result;
use dto::EventSubStats;
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
    stats: Mutex<EventSubStats>,
}

impl Default for Handle {
    fn default() -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        Self {
            tx,
            rx: Mutex::new(Some(rx)),
            stats: Mutex::default(),
        }
    }
}

impl Handle {
    pub(crate) fn clear(&self) {
        if self.send(Channels::new()).is_err() {
            log::warn!("eventsub task stopped, could not clear channels");
        }
    }

    pub(crate) fn stats(&self) -> EventSubStats {
        self.stats.lock().unwrap().clone()
    }

    fn publish(&self, stats: EventSubStats) {
        *self.stats.lock().unwrap() = stats;
    }

    fn send(&self, channels: Channels) -> Result<()> {
        Ok(self.tx.send(channels)?)
    }
}

pub fn spawn(app: tauri::AppHandle, twitch: Twitch) {
    let Some(rx) = twitch.eventsub.rx.lock().unwrap().take() else {
        log::error!("eventsub task already started");
        return;
    };
    tauri::async_runtime::spawn(async move { runner::run(&app, &twitch, rx).await });
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetChannelsParams {
    pub channels: Vec<ChannelFocus>,
}

pub fn set_channels(twitch: &Twitch, params: SetChannelsParams) -> Result<()> {
    twitch.eventsub.send(
        params
            .channels
            .into_iter()
            .map(|c| (c.broadcaster_id, c.focus))
            .collect(),
    )
}
