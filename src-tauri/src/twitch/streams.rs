use crate::{get_token, helix};
use serde::Deserialize;
use std::borrow::Cow;
use twitch_api::types;

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
) -> Result<PaginatedResponse<twitch_api::helix::streams::Stream>, String> {
    let user_ids: Vec<types::UserId> = params
        .user_ids
        .into_iter()
        .map(types::UserId::from)
        .collect();
    let user_logins: Vec<types::UserName> = params
        .user_logins
        .into_iter()
        .map(types::UserName::from)
        .collect();
    let game_ids: Vec<types::CategoryId> = params
        .game_ids
        .into_iter()
        .map(types::CategoryId::from)
        .collect();

    let mut request = twitch_api::helix::streams::GetStreamsRequest::default();
    request.user_id = (&*user_ids).into();
    request.user_login = (&*user_logins).into();
    request.game_id = (&*game_ids).into();
    request.language = params.language.map(Cow::Owned);
    request.first = params.first;
    request.after = params
        .after
        .map(|s| Cow::Owned(twitch_api::helix::Cursor::from(s)));
    request.before = params
        .before
        .map(|s| Cow::Owned(twitch_api::helix::Cursor::from(s)));

    let token = get_token(&app).await?;
    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
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
) -> Result<PaginatedResponse<twitch_api::helix::streams::Stream>, String> {
    let token = get_token(&app).await?;

    let mut request =
        twitch_api::helix::streams::GetFollowedStreamsRequest::user_id(token.user_id.clone());
    request.first = params.first;
    request.after = params
        .after
        .map(|s| Cow::Owned(twitch_api::helix::Cursor::from(s)));

    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
}
