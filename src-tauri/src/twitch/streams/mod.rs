pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use crate::twitch::ids::{GameId, UserId};
use crate::twitch::pagination::PaginatedResponse;
use dto::Stream;
use serde::Deserialize;
use std::borrow::Cow;
use twitch_api::helix::streams::GetStreamsRequest;
use twitch_api::helix::Cursor;
use twitch_api::types;

#[derive(Default, Deserialize, specta::Type)]
#[serde(default, rename_all = "camelCase")]
pub struct GetStreamsParams {
    pub game_ids: Vec<GameId>,
    pub language: Option<String>,
    pub first: Option<usize>,
    pub after: Option<String>,
}

pub async fn get_streams(
    twitch: &Authed<'_>,
    params: GetStreamsParams,
) -> Result<PaginatedResponse<Stream>> {
    let game_ids: Vec<types::CategoryId> = params.game_ids.into_iter().map(Into::into).collect();

    let mut request = GetStreamsRequest::default();
    request.game_id = (&*game_ids).into();
    request.language = params.language.map(Cow::Owned);
    request.first = params.first;
    request.after = params.after.map(|after| Cow::Owned(Cursor::from(after)));

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    let cursor = response
        .pagination_data
        .cursor
        .map(|c| c.as_str().to_string());
    let streams = response.data.into_iter().map(Stream::from).collect();
    Ok(PaginatedResponse::new(streams, cursor))
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetStreamsFromIdsParams {
    pub user_ids: Vec<UserId>,
}

pub async fn get_streams_from_ids(
    twitch: &Authed<'_>,
    params: GetStreamsFromIdsParams,
) -> Result<Vec<Stream>> {
    let ids: Vec<types::UserId> = params.user_ids.into_iter().map(Into::into).collect();
    let ids = ids.into();
    crate::twitch::pagination::collect(twitch.helix.get_streams_from_ids(&ids, &twitch.token)).await
}

pub async fn get_followed_streams(twitch: &Authed<'_>) -> Result<Vec<Stream>> {
    crate::twitch::pagination::collect(twitch.helix.get_followed_streams(&twitch.token)).await
}

#[derive(Default, Deserialize, specta::Type)]
#[serde(default, rename_all = "camelCase")]
pub struct CreateStreamMarkerParams {
    pub description: Option<String>,
}

pub async fn create_stream_marker(
    twitch: &Authed<'_>,
    params: CreateStreamMarkerParams,
) -> Result<()> {
    twitch
        .helix
        .create_stream_marker(
            &twitch.token.user_id,
            params.description.unwrap_or_default(),
            &twitch.token,
        )
        .await?;
    Ok(())
}
