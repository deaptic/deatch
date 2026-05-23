use crate::dto::twitch::channel::Follow;
use crate::services;
use crate::dto::pagination::PaginatedResponse;
use crate::services::twitch::get_token;
use serde::Deserialize;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetChannelFollowersParams {
    pub broadcaster_id: String,
    pub user_id: Option<String>,
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_channel_followers(
    app: tauri::AppHandle,
    params: GetChannelFollowersParams,
) -> Result<PaginatedResponse<Follow>, String> {
    let token = get_token(&app).await?;
    services::twitch::channels::get_channel_followers(
        &token,
        params.broadcaster_id,
        params.user_id,
        params.first,
        params.after,
    )
    .await
}

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
) -> Result<Vec<Follow>, String> {
    let token = get_token(&app).await?;
    services::twitch::channels::get_followed_channels(&token, params.user_id, params.broadcaster_id).await
}

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
    services::twitch::channels::modify_channel_information(&token, params.broadcaster_id, params.title).await
}

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
    services::twitch::channels::start_commercial(&token, params.broadcaster_id, params.length).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddChannelVipParams {
    pub broadcaster_id: String,
    pub user_id: String,
}

#[tauri::command]
pub async fn add_channel_vip(
    app: tauri::AppHandle,
    params: AddChannelVipParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::channels::add_channel_vip(&token, params.broadcaster_id, params.user_id).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveChannelVipParams {
    pub broadcaster_id: String,
    pub user_id: String,
}

#[tauri::command]
pub async fn remove_channel_vip(
    app: tauri::AppHandle,
    params: RemoveChannelVipParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::channels::remove_channel_vip(&token, params.broadcaster_id, params.user_id)
        .await
}
