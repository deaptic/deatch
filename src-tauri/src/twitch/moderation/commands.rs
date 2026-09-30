use super::dto::{Ban, BannedUser};
use crate::error::Result;
use crate::twitch::moderation::{
    self, BanUserParams, DeleteChatMessagesParams, GetBannedUsersParams, GetModeratorsParams,
    ManageHeldAutomodMessageParams, UnbanUserParams, WarnUserParams,
};
use crate::twitch::pagination::PaginatedResponse;
use crate::twitch::users::dto::UserRef;
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
pub async fn unban_user(twitch: State<'_, Twitch>, params: UnbanUserParams) -> Result<()> {
    moderation::unban_user(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_banned_users(
    twitch: State<'_, Twitch>,
    params: GetBannedUsersParams,
) -> Result<PaginatedResponse<BannedUser>> {
    moderation::get_banned_users(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_moderators(
    twitch: State<'_, Twitch>,
    params: GetModeratorsParams,
) -> Result<PaginatedResponse<UserRef>> {
    moderation::get_moderators(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_moderated_channels(twitch: State<'_, Twitch>) -> Result<Vec<UserRef>> {
    moderation::get_moderated_channels(&twitch.authed().await?).await
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
