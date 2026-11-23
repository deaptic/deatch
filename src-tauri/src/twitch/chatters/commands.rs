use super::dto::ChattersPage;
use crate::error::Result;
use crate::twitch::chatters::{self, GetChattersParams};
use crate::twitch::params::BroadcasterParams;
use crate::twitch::users::dto::UserRef;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_chatters(
    twitch: State<'_, Twitch>,
    params: GetChattersParams,
) -> Result<ChattersPage> {
    chatters::get_chatters(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_channel_moderators(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Vec<UserRef>> {
    chatters::get_moderators(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_channel_vips(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Vec<UserRef>> {
    chatters::get_vips(&twitch.authed().await?, params).await
}
