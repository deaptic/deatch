pub mod commands;

use crate::error::{Error, Result};
use discord_rich_presence::activity::{
    Activity, ActivityType, Assets, Button as ActivityButton, StatusDisplayType, Timestamps,
};
use discord_rich_presence::{DiscordIpc, DiscordIpcClient};
use serde::Deserialize;
use std::sync::Mutex;

const CLIENT_ID: &str = "1505340850853380239";
const MAX_BUTTONS: usize = 2;

#[derive(Default)]
pub struct DiscordState(Mutex<Option<DiscordIpcClient>>);

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Button {
    pub label: String,
    pub url: String,
}

#[derive(Default, Deserialize, specta::Type)]
#[serde(default, rename_all = "camelCase")]
pub struct ActivityInput {
    pub details: Option<String>,
    pub details_url: Option<String>,
    pub state_text: Option<String>,
    pub state_url: Option<String>,
    pub large_image: Option<String>,
    pub large_text: Option<String>,
    pub large_url: Option<String>,
    pub small_image: Option<String>,
    pub small_text: Option<String>,
    pub started_at: Option<i64>,
    pub buttons: Vec<Button>,
}

pub fn connect(state: &DiscordState) -> Result<()> {
    let mut client = DiscordIpcClient::new(CLIENT_ID);
    client.connect()?;
    if let Some(mut previous) = state.0.lock().unwrap().replace(client) {
        if let Err(e) = previous.close() {
            log::warn!("discord close of previous client failed: {e}");
        }
    }
    Ok(())
}

pub fn disconnect(state: &DiscordState) -> Result<()> {
    let Some(mut client) = state.0.lock().unwrap().take() else {
        return Ok(());
    };
    if let Err(e) = client.clear_activity() {
        log::warn!("discord clear activity failed: {e}");
    }
    Ok(client.close()?)
}

pub fn set_activity(state: &DiscordState, input: ActivityInput) -> Result<()> {
    let mut guard = state.0.lock().unwrap();
    let client = guard
        .as_mut()
        .ok_or_else(|| Error::Discord("not connected".into()))?;
    Ok(client.set_activity(build_activity(&input))?)
}

fn text(value: &Option<String>) -> Option<&str> {
    value.as_deref().filter(|s| !s.is_empty())
}

fn build_activity(input: &ActivityInput) -> Activity<'_> {
    let mut activity = Activity::new()
        .activity_type(ActivityType::Watching)
        .status_display_type(StatusDisplayType::Details);
    if let Some(v) = text(&input.details) {
        activity = activity.details(v);
    }
    if let Some(v) = text(&input.details_url) {
        activity = activity.details_url(v);
    }
    if let Some(v) = text(&input.state_text) {
        activity = activity.state(v);
    }
    if let Some(v) = text(&input.state_url) {
        activity = activity.state_url(v);
    }
    if let Some(ts) = input.started_at {
        activity = activity.timestamps(Timestamps::new().start(ts));
    }

    let asset_fields = [
        &input.large_image,
        &input.large_text,
        &input.large_url,
        &input.small_image,
        &input.small_text,
    ];
    if asset_fields.iter().any(|v| text(v).is_some()) {
        let mut assets = Assets::new();
        if let Some(v) = text(&input.large_image) {
            assets = assets.large_image(v);
        }
        if let Some(v) = text(&input.large_text) {
            assets = assets.large_text(v);
        }
        if let Some(v) = text(&input.large_url) {
            assets = assets.large_url(v);
        }
        if let Some(v) = text(&input.small_image) {
            assets = assets.small_image(v);
        }
        if let Some(v) = text(&input.small_text) {
            assets = assets.small_text(v);
        }
        activity = activity.assets(assets);
    }

    let buttons: Vec<ActivityButton> = input
        .buttons
        .iter()
        .filter(|b| (1..=32).contains(&b.label.len()) && (1..=512).contains(&b.url.len()))
        .take(MAX_BUTTONS)
        .map(|b| ActivityButton::new(&b.label, &b.url))
        .collect();
    if !buttons.is_empty() {
        activity = activity.buttons(buttons);
    }
    activity
}
