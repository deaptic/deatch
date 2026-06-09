use crate::dto::twitch::search::{Category, SearchChannel};
use crate::services;
use crate::services::twitch::get_token;
use serde::Deserialize;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct SearchChannelsParams {
    pub query: String,
    pub live_only: bool,
    pub first: Option<usize>,
}

#[tauri::command]
pub async fn search_channels(
    app: tauri::AppHandle,
    params: SearchChannelsParams,
) -> Result<Vec<SearchChannel>, String> {
    if params.query.trim().is_empty() {
        return Ok(Vec::new());
    }
    let token = get_token(&app).await?;
    services::twitch::search::search_channels(
        &token,
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
    app: tauri::AppHandle,
    params: SearchCategoriesParams,
) -> Result<Vec<Category>, String> {
    if params.query.trim().is_empty() {
        return Ok(Vec::new());
    }
    let token = get_token(&app).await?;
    services::twitch::search::search_categories(&token, params.query, params.first.or(Some(10)))
        .await
}
