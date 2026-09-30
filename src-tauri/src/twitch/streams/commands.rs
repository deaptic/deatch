use super::dto::Stream;
use crate::error::Result;
use crate::twitch::pagination::PaginatedResponse;
use crate::twitch::streams::{
    self, CreateStreamMarkerParams, GetStreamsFromIdsParams, GetStreamsParams,
};
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
pub async fn get_streams(
    twitch: State<'_, Twitch>,
    params: GetStreamsParams,
) -> Result<PaginatedResponse<Stream>> {
    streams::get_streams(&twitch.authed().await?, params).await
}

#[tauri::command]
pub async fn get_streams_from_ids(
    twitch: State<'_, Twitch>,
    params: GetStreamsFromIdsParams,
) -> Result<Vec<Stream>> {
    streams::get_streams_from_ids(&twitch.authed().await?, params).await
}

#[tauri::command]
pub async fn get_followed_streams(twitch: State<'_, Twitch>) -> Result<Vec<Stream>> {
    streams::get_followed_streams(&twitch.authed().await?).await
}

#[tauri::command]
pub async fn create_stream_marker(
    twitch: State<'_, Twitch>,
    params: CreateStreamMarkerParams,
) -> Result<()> {
    streams::create_stream_marker(&twitch.authed().await?, params).await
}
