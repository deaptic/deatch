use crate::dto::twitch::search::{Category, SearchChannel};
use crate::error::Result;
use crate::services;
use crate::services::twitch::Twitch;
use serde::Deserialize;
use tauri::State;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct SearchChannelsParams {
    pub query: String,
    pub live_only: bool,
    pub first: Option<usize>,
}

#[tauri::command]
pub async fn search_channels(
    twitch: State<'_, Twitch>,
    params: SearchChannelsParams,
) -> Result<Vec<SearchChannel>> {
    if params.query.trim().is_empty() {
        return Ok(Vec::new());
    }
    let twitch = twitch.authed().await?;
    services::twitch::search::search_channels(
        &twitch,
        params.query,
        params.live_only,
        params.first.or(Some(20)),
    )
    .await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct SearchCategoriesParams {
    pub query: String,
    pub first: Option<usize>,
}

#[tauri::command]
pub async fn search_categories(
    twitch: State<'_, Twitch>,
    params: SearchCategoriesParams,
) -> Result<Vec<Category>> {
    if params.query.trim().is_empty() {
        return Ok(Vec::new());
    }
    let twitch = twitch.authed().await?;
    services::twitch::search::search_categories(&twitch, params.query, params.first.or(Some(10)))
        .await
}
