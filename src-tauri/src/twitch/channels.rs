use super::{get_token, helix};
use serde::Deserialize;
use std::borrow::Cow;
use twitch_api::helix::channels::{Follower, GetChannelFollowersRequest};
use twitch_api::helix::Cursor;
use twitch_api::types::UserId;

use super::response::PaginatedResponse;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetChannelFollowersParams {
    pub broadcaster_id: String,
    pub user_id: Option<String>,
    pub first: Option<usize>,
    pub after: Option<String>,
}

// https://dev.twitch.tv/docs/api/reference/#get-channel-followers
#[tauri::command]
pub async fn get_channel_followers(
    app: tauri::AppHandle,
    params: GetChannelFollowersParams,
) -> Result<PaginatedResponse<Follower>, String> {
    let token = get_token(&app).await?;

    let mut request = GetChannelFollowersRequest::broadcaster_id(params.broadcaster_id.as_str());
    if let Some(uid) = params.user_id.as_deref() {
        request.user_id = Some(UserId::from(uid).into());
    }
    request.first = params.first;
    request.after = params.after.map(|s| Cow::Owned(Cursor::from(s)));

    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
}
