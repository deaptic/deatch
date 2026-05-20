use super::{get_token, helix};
use serde::Deserialize;
use std::borrow::Cow;
use twitch_api::helix::channels::{
    get_followed_channels::{FollowedBroadcaster, GetFollowedChannels},
    modify_channel_information::{ModifyChannelInformationBody, ModifyChannelInformationRequest},
    start_commercial::{StartCommercialBody, StartCommercialRequest},
    Follower, GetChannelFollowersRequest,
};
use twitch_api::helix::Cursor;
use twitch_api::types::{CommercialLength, UserId};

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

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetAllChannelFollowersParams {
    pub broadcaster_id: String,
    pub user_id: Option<String>,
}

#[tauri::command]
pub async fn get_all_channel_followers(
    app: tauri::AppHandle,
    params: GetAllChannelFollowersParams,
) -> Result<Vec<Follower>, String> {
    let token = get_token(&app).await?;
    let bc = params.broadcaster_id;
    let uid = params.user_id;
    super::utils::fetch_all_pages(&token, move |after| {
        let mut request = GetChannelFollowersRequest::broadcaster_id(UserId::from(bc.clone()));
        if let Some(u) = uid.as_deref() {
            request.user_id = Some(UserId::from(u).into());
        }
        request.after = after.map(|s| Cow::Owned(Cursor::from(s)));
        request
    })
    .await
}

// https://dev.twitch.tv/docs/api/reference/#get-followed-channels
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetFollowedChannelsParams {
    pub user_id: String,
    #[serde(default)]
    pub broadcaster_id: Option<String>,
}

#[tauri::command]
pub async fn get_followed_channels(
    app: tauri::AppHandle,
    params: GetFollowedChannelsParams,
) -> Result<Vec<FollowedBroadcaster>, String> {
    let token = get_token(&app).await?;
    let mut request = GetFollowedChannels::user_id(params.user_id.as_str());
    if let Some(bid) = params.broadcaster_id.as_deref() {
        request = request.broadcaster_id(bid);
    }
    helix()
        .req_get(request, &token)
        .await
        .map(|r| r.data)
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#modify-channel-information
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct ModifyChannelInformationParams {
    pub broadcaster_id: String,
    pub title: Option<String>,
}

#[tauri::command]
pub async fn modify_channel_information(
    app: tauri::AppHandle,
    params: ModifyChannelInformationParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    let request = ModifyChannelInformationRequest::broadcaster_id(params.broadcaster_id.as_str());
    let mut body = ModifyChannelInformationBody::default();
    if let Some(t) = params.title.as_deref().filter(|s| !s.is_empty()) {
        body.title = Some(Cow::Borrowed(t));
    }
    helix()
        .req_patch(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#start-commercial
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartCommercialParams {
    pub broadcaster_id: String,
    pub length: u64,
}

#[tauri::command]
pub async fn start_commercial(
    app: tauri::AppHandle,
    params: StartCommercialParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    let length = CommercialLength::try_from(params.length)
        .map_err(|e| e.to_string())?;
    let request = StartCommercialRequest::new();
    let body = StartCommercialBody::new(params.broadcaster_id.as_str(), length);
    helix()
        .req_post(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
