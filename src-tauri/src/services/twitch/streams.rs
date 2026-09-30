use super::Authed;
use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::stream::Stream;
use crate::error::Result;
use std::borrow::Cow;
use twitch_api::helix::streams::{
    create_stream_marker::{CreateStreamMarkerBody, CreateStreamMarkerRequest},
    GetFollowedStreamsRequest, GetStreamsRequest,
};
use twitch_api::types::{CategoryId, UserId, UserName};

#[derive(Default)]
pub struct Filters {
    pub user_ids: Vec<String>,
    pub user_logins: Vec<String>,
    pub game_ids: Vec<String>,
    pub language: Option<String>,
}

pub async fn get_streams(
    twitch: &Authed<'_>,
    filters: Filters,
    first: Option<usize>,
    after: Option<String>,
    before: Option<String>,
) -> Result<PaginatedResponse<Stream>> {
    let user_ids: Vec<UserId> = filters.user_ids.into_iter().map(UserId::from).collect();
    let user_logins: Vec<UserName> = filters
        .user_logins
        .into_iter()
        .map(UserName::from)
        .collect();
    let game_ids: Vec<CategoryId> = filters.game_ids.into_iter().map(CategoryId::from).collect();

    let mut request = GetStreamsRequest::default();
    request.user_id = (&*user_ids).into();
    request.user_login = (&*user_logins).into();
    request.game_id = (&*game_ids).into();
    request.language = filters.language.map(Cow::Owned);
    request.first = first;
    request.after = super::cursor(after);
    request.before = super::cursor(before);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(super::into_paginated(response, Stream::from))
}

pub async fn get_followed_streams(
    twitch: &Authed<'_>,
    first: Option<usize>,
    after: Option<String>,
) -> Result<PaginatedResponse<Stream>> {
    let mut request = GetFollowedStreamsRequest::user_id(twitch.token.user_id.clone());
    request.first = first;
    request.after = super::cursor(after);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(super::into_paginated(response, Stream::from))
}

pub async fn create_stream_marker(twitch: &Authed<'_>, description: Option<String>) -> Result<()> {
    let request = CreateStreamMarkerRequest::new();
    let body = CreateStreamMarkerBody::new(
        twitch.token.user_id.as_str(),
        description.as_deref().unwrap_or(""),
    );
    twitch.helix.req_post(request, body, &twitch.token).await?;
    Ok(())
}
