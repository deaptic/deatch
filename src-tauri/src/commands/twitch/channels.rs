use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::channel::{ChannelInfo, Follow};
use crate::error::Result;
use crate::services;
use crate::services::twitch::Twitch;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetChannelInformationParams {
    pub broadcaster_ids: Vec<String>,
}

#[tauri::command]
pub async fn get_channel_information(
    twitch: State<'_, Twitch>,
    params: GetChannelInformationParams,
) -> Result<Vec<ChannelInfo>> {
    let twitch = twitch.authed().await?;
    services::twitch::channels::get_channel_information(&twitch, params.broadcaster_ids).await
}

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
    twitch: State<'_, Twitch>,
    params: GetChannelFollowersParams,
) -> Result<PaginatedResponse<Follow>> {
    let twitch = twitch.authed().await?;
    services::twitch::channels::get_channel_followers(
        &twitch,
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
    twitch: State<'_, Twitch>,
    params: GetFollowedChannelsParams,
) -> Result<Vec<Follow>> {
    let twitch = twitch.authed().await?;
    services::twitch::channels::get_followed_channels(
        &twitch,
        params.user_id,
        params.broadcaster_id,
    )
    .await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct ModifyChannelInformationParams {
    pub broadcaster_id: String,
    pub title: Option<String>,
    pub game_id: Option<String>,
}

#[tauri::command]
pub async fn modify_channel_information(
    twitch: State<'_, Twitch>,
    params: ModifyChannelInformationParams,
) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::channels::modify_channel_information(
        &twitch,
        params.broadcaster_id,
        params.title,
        params.game_id,
    )
    .await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartCommercialParams {
    pub broadcaster_id: String,
    pub length: u64,
}

#[tauri::command]
pub async fn start_commercial(
    twitch: State<'_, Twitch>,
    params: StartCommercialParams,
) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::channels::start_commercial(&twitch, params.broadcaster_id, params.length)
        .await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddChannelVipParams {
    pub broadcaster_id: String,
    pub user_id: String,
}

#[tauri::command]
pub async fn add_channel_vip(twitch: State<'_, Twitch>, params: AddChannelVipParams) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::channels::add_channel_vip(&twitch, params.broadcaster_id, params.user_id)
        .await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveChannelVipParams {
    pub broadcaster_id: String,
    pub user_id: String,
}

#[tauri::command]
pub async fn remove_channel_vip(
    twitch: State<'_, Twitch>,
    params: RemoveChannelVipParams,
) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::channels::remove_channel_vip(&twitch, params.broadcaster_id, params.user_id)
        .await
}
