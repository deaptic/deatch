use super::dto::ChannelInfo;
use crate::error::Result;
use crate::twitch::channels::{
    self, GetChannelInformationParams, ModifyChannelInformationParams, StartCommercialParams,
};
use crate::twitch::params::BroadcasterUserParams;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_channel_information(
    twitch: State<'_, Twitch>,
    params: GetChannelInformationParams,
) -> Result<Vec<ChannelInfo>> {
    channels::get_channel_information(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_followed_at(
    twitch: State<'_, Twitch>,
    params: BroadcasterUserParams,
) -> Result<Option<String>> {
    channels::get_followed_at(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn modify_channel_information(
    twitch: State<'_, Twitch>,
    params: ModifyChannelInformationParams,
) -> Result<()> {
    channels::modify_channel_information(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn start_commercial(
    twitch: State<'_, Twitch>,
    params: StartCommercialParams,
) -> Result<()> {
    channels::start_commercial(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn add_channel_vip(
    twitch: State<'_, Twitch>,
    params: BroadcasterUserParams,
) -> Result<()> {
    channels::add_channel_vip(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn remove_channel_vip(
    twitch: State<'_, Twitch>,
    params: BroadcasterUserParams,
) -> Result<()> {
    channels::remove_channel_vip(&twitch.authed().await?, params).await
}
