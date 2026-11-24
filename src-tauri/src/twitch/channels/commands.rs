use super::dto::{ChannelDetails, ChannelInfo, ContentLabel, FollowersPage};
use crate::platform::error::Result;
use crate::twitch::channels::{
    self, GetChannelInformationParams, GetContentLabelsParams, GetFollowersParams,
    ModifyChannelInformationParams, StartCommercialParams,
};
use crate::twitch::client::params::{BroadcasterParams, BroadcasterUserParams};
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
pub async fn add_channel_moderator(
    twitch: State<'_, Twitch>,
    params: BroadcasterUserParams,
) -> Result<()> {
    channels::add_channel_moderator(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn remove_channel_moderator(
    twitch: State<'_, Twitch>,
    params: BroadcasterUserParams,
) -> Result<()> {
    channels::remove_channel_moderator(&twitch.authed().await?, params).await
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

#[tauri::command]
#[specta::specta]
pub async fn get_channel_details(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Option<ChannelDetails>> {
    channels::get_channel_details(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_content_labels(
    twitch: State<'_, Twitch>,
    params: GetContentLabelsParams,
) -> Result<Vec<ContentLabel>> {
    channels::get_content_labels(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_followers(
    twitch: State<'_, Twitch>,
    params: GetFollowersParams,
) -> Result<FollowersPage> {
    channels::get_followers(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_follower_count(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Option<u32>> {
    channels::get_follower_count(&twitch.authed().await?, params).await
}
