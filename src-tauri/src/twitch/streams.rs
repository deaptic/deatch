use super::{get_token, helix};
use serde::Deserialize;
use std::borrow::Cow;
use twitch_api::helix::streams::{
    create_stream_marker::{CreateStreamMarkerBody, CreateStreamMarkerRequest},
    GetFollowedStreamsRequest, GetStreamsRequest, Stream,
};
use twitch_api::helix::Cursor;
use twitch_api::types::{CategoryId, UserId, UserName};

use super::response::PaginatedResponse;

// https://dev.twitch.tv/docs/api/reference/#get-streams
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
    let user_ids: Vec<UserId> = params.user_ids.into_iter().map(UserId::from).collect();
    let user_logins: Vec<UserName> = params.user_logins.into_iter().map(UserName::from).collect();
    let game_ids: Vec<CategoryId> = params.game_ids.into_iter().map(CategoryId::from).collect();

    let mut request = GetStreamsRequest::default();
    request.user_id = (&*user_ids).into();
    request.user_login = (&*user_logins).into();
    request.game_id = (&*game_ids).into();
    request.language = params.language.map(Cow::Owned);
    request.first = params.first;
    request.after = params.after.map(|s| Cow::Owned(Cursor::from(s)));
    request.before = params.before.map(|s| Cow::Owned(Cursor::from(s)));

    let token = get_token(&app).await?;
    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetAllStreamsParams {
    pub user_ids: Vec<String>,
    pub user_logins: Vec<String>,
    pub game_ids: Vec<String>,
    pub language: Option<String>,
}

#[tauri::command]
pub async fn get_all_streams(
    app: tauri::AppHandle,
    params: GetAllStreamsParams,
) -> Result<Vec<Stream>, String> {
    let token = get_token(&app).await?;
    let user_ids: Vec<UserId> = params.user_ids.into_iter().map(UserId::from).collect();
    let user_logins: Vec<UserName> = params.user_logins.into_iter().map(UserName::from).collect();
    let game_ids: Vec<CategoryId> = params.game_ids.into_iter().map(CategoryId::from).collect();
    let language = params.language;

    super::utils::fetch_all_pages(&token, |after| {
        let mut request = GetStreamsRequest::default();
        request.user_id = (&*user_ids).into();
        request.user_login = (&*user_logins).into();
        request.game_id = (&*game_ids).into();
        request.language = language.clone().map(Cow::Owned);
        request.after = after.map(|s| Cow::Owned(Cursor::from(s)));
        request
    })
    .await
}

// https://dev.twitch.tv/docs/api/reference/#get-followed-streams
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

    let mut request = GetFollowedStreamsRequest::user_id(token.user_id.clone());
    request.first = params.first;
    request.after = params.after.map(|s| Cow::Owned(Cursor::from(s)));

    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
}

#[tauri::command]
pub async fn get_all_followed_streams(app: tauri::AppHandle) -> Result<Vec<Stream>, String> {
    let token = get_token(&app).await?;
    super::utils::fetch_all_pages(&token, |after| {
        let mut request = GetFollowedStreamsRequest::user_id(token.user_id.clone());
        request.after = after.map(|s| Cow::Owned(Cursor::from(s)));
        request
    })
    .await
}

// https://dev.twitch.tv/docs/api/reference/#create-stream-marker
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
    let request = CreateStreamMarkerRequest::new();
    let body = CreateStreamMarkerBody::new(
        token.user_id.as_str(),
        params.description.as_deref().unwrap_or(""),
    );
    helix()
        .req_post(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
