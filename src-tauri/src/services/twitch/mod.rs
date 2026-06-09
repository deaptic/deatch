pub mod auth;
pub mod channels;
pub mod chat;
pub mod clips;
pub mod eventsub;
pub mod moderation;
pub mod raids;
pub mod search;
pub mod streams;
pub mod users;

use crate::dto::twitch::user::UserRef;
use std::collections::HashSet;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{Emitter, Manager};
use tokio::sync::mpsc;
use twitch_api::helix::RequestGet;
use twitch_api::twitch_oauth2::{TwitchToken, UserToken};

pub struct TwitchState {
    pub token: Mutex<Option<UserToken>>,
    pub eventsub_tx: Mutex<Option<mpsc::UnboundedSender<eventsub::EventSubCmd>>>,
    /// Serializes `eventsub::ensure_task` so concurrent `subscribe` calls
    /// can't race the auth check or spawn duplicate tasks.
    pub eventsub_init: tokio::sync::Mutex<()>,
    pub moderated_channel_ids: Mutex<HashSet<String>>,
}

impl TwitchState {
    pub fn new() -> Self {
        Self {
            token: Mutex::new(None),
            eventsub_tx: Mutex::new(None),
            eventsub_init: tokio::sync::Mutex::new(()),
            moderated_channel_ids: Mutex::new(HashSet::new()),
        }
    }
}

pub async fn get_token(app: &tauri::AppHandle) -> Result<UserToken, String> {
    let needs_refresh = {
        let state = app.state::<TwitchState>();
        let guard = state.token.lock().unwrap();
        match guard.as_ref() {
            None => return Err("Not authenticated".to_string()),
            Some(t) => t.expires_in() < Duration::from_secs(60),
        }
    };
    if needs_refresh {
        if let Err(e) = auth::refresh_token_now(app).await {
            let _ = app.emit("twitch-auth-error", format!("refresh failed: {e}"));
        }
    }
    app.state::<TwitchState>()
        .token
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "Not authenticated".to_string())
}

pub fn helix() -> twitch_api::HelixClient<'static, reqwest::Client> {
    twitch_api::HelixClient::new()
}

pub fn cache_moderated_channel_ids(app: &tauri::AppHandle, channels: &[UserRef]) {
    let ids: HashSet<String> = channels.iter().map(|ch| ch.id.0.clone()).collect();
    *app.state::<TwitchState>().moderated_channel_ids.lock().unwrap() = ids;
}

// Helix gives user tokens 800 points/minute (~13 req/sec). We pace at ~10
// req/sec so a long paginator can't blow the budget on its own and so
// concurrent calls have headroom. Single-page fetches don't pay this —
// the sleep only runs when there's another page to retrieve.
const PAGE_INTERVAL: Duration = Duration::from_millis(100);

/// Drives a Helix paginated GET to completion. `make_request` is called once
/// per page; it receives the previous page's cursor (or `None` on the first
/// call) and returns a fresh request with that cursor applied. Pages are
/// concatenated into the returned `Vec`.
pub async fn fetch_all_pages<R, T, F>(
    token: &UserToken,
    mut make_request: F,
) -> Result<Vec<T>, String>
where
    F: FnMut(Option<String>) -> R,
    R: RequestGet<Response = Vec<T>>,
    T: serde::de::DeserializeOwned + PartialEq,
{
    let helix = helix();
    let mut all: Vec<T> = Vec::new();
    let mut after: Option<String> = None;
    loop {
        let request = make_request(after.take());
        let response = helix
            .req_get(request, token)
            .await
            .map_err(|e| e.to_string())?;
        all.extend(response.data);
        match response.pagination {
            Some(cursor) => {
                after = Some(cursor.as_str().to_string());
                tokio::time::sleep(PAGE_INTERVAL).await;
            }
            None => return Ok(all),
        }
    }
}
