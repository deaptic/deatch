use super::dto::{Ban, BannedUser};
use crate::error::Result;
use crate::twitch::moderation::{
    self, BanUserParams, DeleteChatMessagesParams, ManageHeldAutomodMessageParams, WarnUserParams,
};
use crate::twitch::params::BroadcasterUserParams;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn delete_chat_messages(
    twitch: State<'_, Twitch>,
    params: DeleteChatMessagesParams,
) -> Result<()> {
    moderation::delete_chat_messages(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn ban_user(twitch: State<'_, Twitch>, params: BanUserParams) -> Result<Ban> {
    moderation::ban_user(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn unban_user(twitch: State<'_, Twitch>, params: BroadcasterUserParams) -> Result<()> {
    moderation::unban_user(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_ban(
    twitch: State<'_, Twitch>,
    params: BroadcasterUserParams,
) -> Result<Option<BannedUser>> {
    moderation::get_ban(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn warn_user(twitch: State<'_, Twitch>, params: WarnUserParams) -> Result<()> {
    moderation::warn_user(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn manage_held_automod_message(
    twitch: State<'_, Twitch>,
    params: ManageHeldAutomodMessageParams,
) -> Result<()> {
    moderation::manage_held_automod_message(&twitch.authed().await?, params).await
}
