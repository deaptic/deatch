pub mod auth;
pub mod channels;
pub mod chat;
pub mod eventsub;
pub mod moderation;
pub mod response;
pub mod streams;
pub mod users;
mod utils;

use std::collections::HashSet;
use std::sync::Mutex;
use tauri::Manager;
use tokio::sync::mpsc;
use twitch_api::twitch_oauth2::{TwitchToken, UserToken};

pub(crate) struct TwitchState {
    pub(crate) token: Mutex<Option<UserToken>>,
    pub(crate) eventsub_tx: Mutex<Option<mpsc::UnboundedSender<eventsub::EventSubCmd>>>,
    /// Serializes `eventsub::runner::ensure_task` so concurrent
    /// subscribe_channel calls can't race the auth check or spawn duplicate
    /// tasks.
    pub(crate) eventsub_init: tokio::sync::Mutex<()>,
    pub(crate) moderated_channel_ids: Mutex<HashSet<String>>,
}

impl TwitchState {
    pub(crate) fn new() -> Self {
        Self {
            token: Mutex::new(None),
            eventsub_tx: Mutex::new(None),
            eventsub_init: tokio::sync::Mutex::new(()),
            moderated_channel_ids: Mutex::new(HashSet::new()),
        }
    }
}

pub(crate) async fn get_token(app: &tauri::AppHandle) -> Result<UserToken, String> {
    let needs_refresh = {
        let state = app.state::<TwitchState>();
        let guard = state.token.lock().unwrap();
        match guard.as_ref() {
            None => return Err("Not authenticated".to_string()),
            Some(t) => t.expires_in() < std::time::Duration::from_secs(60),
        }
    };
    if needs_refresh {
        let _ = auth::refresh_token_now(app).await;
    }
    app.state::<TwitchState>()
        .token
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "Not authenticated".to_string())
}

pub(crate) fn helix() -> twitch_api::HelixClient<'static, reqwest::Client> {
    twitch_api::HelixClient::new()
}
