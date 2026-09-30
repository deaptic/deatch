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
use twitch_api::types;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetStreamsParams {
    pub user_ids: Vec<UserId>,
    pub user_logins: Vec<String>,
    pub game_ids: Vec<GameId>,
    pub language: Option<String>,
    pub first: Option<usize>,
    pub after: Option<String>,
    pub before: Option<String>,
}

pub async fn get_streams(
    twitch: &Authed<'_>,
    params: GetStreamsParams,
) -> Result<PaginatedResponse<Stream>> {
    let user_ids: Vec<types::UserId> = params.user_ids.into_iter().map(|id| id.0.into()).collect();
    let user_logins: Vec<types::UserName> =
        params.user_logins.into_iter().map(Into::into).collect();
    let game_ids: Vec<types::CategoryId> =
        params.game_ids.into_iter().map(|id| id.0.into()).collect();

    let mut request = GetStreamsRequest::default();
    request.user_id = (&*user_ids).into();
    request.user_login = (&*user_logins).into();
    request.game_id = (&*game_ids).into();
    request.language = params.language.map(Cow::Owned);
    request.first = params.first;
    request.after = crate::twitch::pagination::cursor(params.after);
    request.before = crate::twitch::pagination::cursor(params.before);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(crate::twitch::pagination::into_paginated(
        response,
        Stream::from,
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetStreamsFromIdsParams {
    pub user_ids: Vec<UserId>,
}

pub async fn get_streams_from_ids(
    twitch: &Authed<'_>,
    params: GetStreamsFromIdsParams,
) -> Result<Vec<Stream>> {
    let ids: Vec<types::UserId> = params.user_ids.into_iter().map(|id| id.0.into()).collect();
    let ids = ids.into();
    crate::twitch::pagination::collect(twitch.helix.get_streams_from_ids(&ids, &twitch.token)).await
}

pub async fn get_followed_streams(twitch: &Authed<'_>) -> Result<Vec<Stream>> {
    crate::twitch::pagination::collect(twitch.helix.get_followed_streams(&twitch.token)).await
}

#[derive(Default, Deserialize)]
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
