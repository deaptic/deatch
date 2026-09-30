use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::stream::Stream;
use crate::error::Result;
use crate::services;
use crate::services::twitch::streams::Filters;
use crate::services::twitch::Twitch;
use serde::Deserialize;
use tauri::State;

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
    twitch: State<'_, Twitch>,
    params: GetStreamsParams,
) -> Result<PaginatedResponse<Stream>> {
    let twitch = twitch.authed().await?;
    let filters = Filters {
        user_ids: params.user_ids,
        user_logins: params.user_logins,
        game_ids: params.game_ids,
        language: params.language,
    };
    services::twitch::streams::get_streams(
        &twitch,
        filters,
        params.first,
        params.after,
        params.before,
    )
    .await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetFollowedStreamsParams {
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_followed_streams(
    twitch: State<'_, Twitch>,
    params: GetFollowedStreamsParams,
) -> Result<PaginatedResponse<Stream>> {
    let twitch = twitch.authed().await?;
    services::twitch::streams::get_followed_streams(&twitch, params.first, params.after).await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct CreateStreamMarkerParams {
    pub description: Option<String>,
}

#[tauri::command]
pub async fn create_stream_marker(
    twitch: State<'_, Twitch>,
    params: CreateStreamMarkerParams,
) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::streams::create_stream_marker(&twitch, params.description).await
}
