use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use serde::Deserialize;
use std::sync::Mutex;
use tauri::State;

#[derive(Deserialize)]
pub struct DiscordButton {
    pub label: String,
    pub url: String,
}

// Replace with your application's Discord client id from
// https://discord.com/developers/applications. Asset keys referenced
// by `large_image` / `small_image` must be uploaded under "Rich Presence"
// in that same application.
const DEFAULT_CLIENT_ID: &str = "1505340850853380239";

pub struct DiscordState(pub Mutex<Option<DiscordIpcClient>>);

impl DiscordState {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }
}

#[tauri::command]
pub async fn discord_connect(
    client_id: Option<String>,
    state: State<'_, DiscordState>,
) -> Result<(), String> {
    let id = client_id.unwrap_or_else(|| DEFAULT_CLIENT_ID.to_string());
    let mut client = DiscordIpcClient::new(&id);
    client.connect().map_err(|e| e.to_string())?;
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(mut prev) = guard.take() {
        let _ = prev.close();
    }
    *guard = Some(client);
    Ok(())
}

#[tauri::command]
pub async fn discord_disconnect(state: State<'_, DiscordState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(mut client) = guard.take() {
        let _ = client.clear_activity();
        client.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn discord_set_activity(
    details: Option<String>,
    details_url: Option<String>,
    state_text: Option<String>,
    state_url: Option<String>,
    large_image: Option<String>,
    large_text: Option<String>,
    large_url: Option<String>,
    small_image: Option<String>,
    small_text: Option<String>,
    started_at: Option<i64>,
    activity_type: Option<String>,
    status_display_type: Option<String>,
    buttons: Option<Vec<DiscordButton>>,
    state: State<'_, DiscordState>,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let client = guard
        .as_mut()
        .ok_or_else(|| "discord not connected".to_string())?;

    let mut activity = activity::Activity::new();
    if let Some(d) = details.as_deref().filter(|s| !s.is_empty()) {
        activity = activity.details(d);
    }
    if let Some(u) = details_url.as_deref().filter(|s| !s.is_empty()) {
        activity = activity.details_url(u);
    }
    if let Some(s) = state_text.as_deref().filter(|s| !s.is_empty()) {
        activity = activity.state(s);
    }
    if let Some(u) = state_url.as_deref().filter(|s| !s.is_empty()) {
        activity = activity.state_url(u);
    }
    if let Some(kind) = activity_type.as_deref() {
        let parsed = match kind {
            "playing" => Some(activity::ActivityType::Playing),
            "listening" => Some(activity::ActivityType::Listening),
            "watching" => Some(activity::ActivityType::Watching),
            "competing" => Some(activity::ActivityType::Competing),
            _ => None,
        };
        if let Some(t) = parsed {
            activity = activity.activity_type(t);
        }
    }
    if let Some(kind) = status_display_type.as_deref() {
        let parsed = match kind {
            "name" => Some(activity::StatusDisplayType::Name),
            "state" => Some(activity::StatusDisplayType::State),
            "details" => Some(activity::StatusDisplayType::Details),
            _ => None,
        };
        if let Some(t) = parsed {
            activity = activity.status_display_type(t);
        }
    }

    let mut assets = activity::Assets::new();
    let mut has_assets = false;
    if let Some(v) = large_image.as_deref().filter(|s| !s.is_empty()) {
        assets = assets.large_image(v);
        has_assets = true;
    }
    if let Some(v) = large_text.as_deref().filter(|s| !s.is_empty()) {
        assets = assets.large_text(v);
        has_assets = true;
    }
    if let Some(v) = large_url.as_deref().filter(|s| !s.is_empty()) {
        assets = assets.large_url(v);
        has_assets = true;
    }
    if let Some(v) = small_image.as_deref().filter(|s| !s.is_empty()) {
        assets = assets.small_image(v);
        has_assets = true;
    }
    if let Some(v) = small_text.as_deref().filter(|s| !s.is_empty()) {
        assets = assets.small_text(v);
        has_assets = true;
    }
    if has_assets {
        activity = activity.assets(assets);
    }

    if let Some(ts) = started_at {
        activity = activity.timestamps(activity::Timestamps::new().start(ts));
    }

    let btns: Vec<activity::Button> = buttons
        .as_deref()
        .unwrap_or(&[])
        .iter()
        .filter(|b| {
            let l = b.label.len();
            let u = b.url.len();
            (1..=32).contains(&l) && (1..=512).contains(&u)
        })
        .take(2)
        .map(|b| activity::Button::new(&b.label, &b.url))
        .collect();
    if !btns.is_empty() {
        activity = activity.buttons(btns);
    }

    client.set_activity(activity).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn discord_clear_activity(state: State<'_, DiscordState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(client) = guard.as_mut() {
        client.clear_activity().map_err(|e| e.to_string())?;
    }
    Ok(())
}
