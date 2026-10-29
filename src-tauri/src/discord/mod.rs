pub mod commands;

use crate::error::{Error, Result};
use crate::lock::lock;
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
pub struct SetActivityParams {
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
    if let Some(mut previous) = lock(&state.0).replace(client) {
        if let Err(e) = previous.close() {
            log::warn!("discord close of previous client failed: {e}");
        }
    }
    Ok(())
}

pub fn disconnect(state: &DiscordState) -> Result<()> {
    let Some(mut client) = lock(&state.0).take() else {
        return Ok(());
    };
    if let Err(e) = client.clear_activity() {
        log::warn!("discord clear activity failed: {e}");
    }
    Ok(client.close()?)
}

pub fn set_activity(state: &DiscordState, params: SetActivityParams) -> Result<()> {
    let mut guard = lock(&state.0);
    let client = guard
        .as_mut()
        .ok_or_else(|| Error::Discord("not connected".into()))?;
    Ok(client.set_activity(build_activity(&params))?)
}

fn text(value: &Option<String>) -> Option<&str> {
    value.as_deref().filter(|s| !s.is_empty())
}

fn build_activity(input: &SetActivityParams) -> Activity<'_> {
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

#[cfg(test)]
mod tests {
    use super::{build_activity, Button, SetActivityParams};

    fn button(label: &str, url: &str) -> Button {
        Button {
            label: label.into(),
            url: url.into(),
        }
    }

    #[test]
    fn empty_fields_are_left_out() {
        let input = SetActivityParams {
            details: Some("Watching xqc".into()),
            state_text: Some(String::new()),
            large_text: Some(String::new()),
            ..SetActivityParams::default()
        };
        let value = serde_json::to_value(build_activity(&input)).unwrap();
        assert_eq!(value["details"], "Watching xqc");
        assert!(value.get("state").is_none());
        assert!(value.get("assets").is_none());
    }

    #[test]
    fn keeps_at_most_two_buttons_discord_accepts() {
        let input = SetActivityParams {
            buttons: vec![
                button("", "https://twitch.tv/a"),
                button(&"x".repeat(33), "https://twitch.tv/b"),
                button("Watch", "https://twitch.tv/c"),
                button("Chat", "https://twitch.tv/d"),
                button("Third", "https://twitch.tv/e"),
            ],
            ..SetActivityParams::default()
        };
        let value = serde_json::to_value(build_activity(&input)).unwrap();
        let labels: Vec<_> = value["buttons"]
            .as_array()
            .unwrap()
            .iter()
            .map(|b| b["label"].as_str().unwrap())
            .collect();
        assert_eq!(labels, ["Watch", "Chat"]);
    }
}
