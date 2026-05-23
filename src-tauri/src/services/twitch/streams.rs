use crate::dto::twitch::stream::Stream;
use super::helix;
use crate::dto::pagination::PaginatedResponse;
use std::borrow::Cow;
use twitch_api::helix::streams::{
    create_stream_marker::{CreateStreamMarkerBody, CreateStreamMarkerRequest},
    GetFollowedStreamsRequest, GetStreamsRequest,
};
use twitch_api::helix::Cursor;
use twitch_api::twitch_oauth2::UserToken;
use twitch_api::types::{CategoryId, UserId, UserName};

#[derive(Default)]
pub struct Filters {
    pub user_ids: Vec<String>,
    pub user_logins: Vec<String>,
    pub game_ids: Vec<String>,
    pub language: Option<String>,
}

pub async fn get_streams(
    token: &UserToken,
    filters: Filters,
    first: Option<usize>,
    after: Option<String>,
    before: Option<String>,
) -> Result<PaginatedResponse<Stream>, String> {
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
    request.after = after.map(|s| Cow::Owned(Cursor::from(s)));
    request.before = before.map(|s| Cow::Owned(Cursor::from(s)));

    let response = helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(
        response.data.into_iter().map(Stream::from).collect(),
        response.pagination.map(|c| c.as_str().to_string()),
    ))
}

pub async fn get_followed_streams(
    token: &UserToken,
    first: Option<usize>,
    after: Option<String>,
) -> Result<PaginatedResponse<Stream>, String> {
    let mut request = GetFollowedStreamsRequest::user_id(token.user_id.clone());
    request.first = first;
    request.after = after.map(|s| Cow::Owned(Cursor::from(s)));

    let response = helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(
        response.data.into_iter().map(Stream::from).collect(),
        response.pagination.map(|c| c.as_str().to_string()),
    ))
}

pub async fn create_stream_marker(
    token: &UserToken,
    description: Option<String>,
) -> Result<(), String> {
    let request = CreateStreamMarkerRequest::new();
    let body = CreateStreamMarkerBody::new(
        token.user_id.as_str(),
        description.as_deref().unwrap_or(""),
    );
    helix()
        .req_post(request, body, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
