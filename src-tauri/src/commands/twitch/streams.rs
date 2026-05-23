use crate::dto::twitch::stream::Stream;
use crate::services;
use crate::services::twitch::streams::Filters;
use crate::dto::pagination::PaginatedResponse;
use crate::services::twitch::get_token;
use serde::Deserialize;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetStreamsParams {
    pub user_ids: Vec<String>,
    pub user_logins: Vec<String>,
    pub game_ids: Vec<String>,
    pub language: Option<String>,
    pub first: Option<usize>,
    pub after: Option<String>,
    pub before: Option<String>,
}

#[tauri::command]
pub async fn get_streams(
    app: tauri::AppHandle,
    params: GetStreamsParams,
) -> Result<PaginatedResponse<Stream>, String> {
    let token = get_token(&app).await?;
    let filters = Filters {
        user_ids: params.user_ids,
        user_logins: params.user_logins,
        game_ids: params.game_ids,
        language: params.language,
    };
    services::twitch::streams::get_streams(&token, filters, params.first, params.after, params.before).await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetFollowedStreamsParams {
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_followed_streams(
    app: tauri::AppHandle,
    params: GetFollowedStreamsParams,
) -> Result<PaginatedResponse<Stream>, String> {
    let token = get_token(&app).await?;
    services::twitch::streams::get_followed_streams(&token, params.first, params.after).await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct CreateStreamMarkerParams {
    pub description: Option<String>,
}

#[tauri::command]
pub async fn create_stream_marker(
    app: tauri::AppHandle,
    params: CreateStreamMarkerParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::streams::create_stream_marker(&token, params.description).await
}
