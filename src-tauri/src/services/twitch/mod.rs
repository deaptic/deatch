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

use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::user::UserRef;
use std::borrow::Cow;
use std::collections::HashSet;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{Emitter, Manager};
use tokio::sync::mpsc;
use twitch_api::helix::{Cursor, CursorRef, Request, Response};
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

pub fn cursor(after: Option<String>) -> Option<Cow<'static, CursorRef>> {
    after.map(|s| Cow::Owned(Cursor::from(s)))
}

pub fn into_paginated<R, U, T>(
    response: Response<R, Vec<U>>,
    map: impl FnMut(U) -> T,
) -> PaginatedResponse<T>
where
    R: Request,
    U: serde::de::DeserializeOwned + PartialEq,
{
    PaginatedResponse::new(
        response.data.into_iter().map(map).collect(),
        response.pagination.map(|c| c.as_str().to_string()),
    )
}

pub fn cache_moderated_channel_ids(app: &tauri::AppHandle, channels: &[UserRef]) {
    let ids: HashSet<String> = channels.iter().map(|ch| ch.id.0.clone()).collect();
    *app.state::<TwitchState>().moderated_channel_ids.lock().unwrap() = ids;
}

