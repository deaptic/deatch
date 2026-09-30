use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::moderation::{Ban, BannedUser};
use crate::dto::twitch::user::UserRef;
use crate::error::Result;
use crate::services::twitch::moderation::{
    self, BanUserParams, DeleteChatMessagesParams, GetBannedUsersParams, GetModeratorsParams,
    ManageHeldAutomodMessageParams, UnbanUserParams, WarnUserParams,
};
use crate::services::twitch::Twitch;
use tauri::State;

#[tauri::command]
pub async fn delete_chat_messages(
    twitch: State<'_, Twitch>,
    params: DeleteChatMessagesParams,
) -> Result<()> {
    moderation::delete_chat_messages(&twitch.authed().await?, params).await
}

#[tauri::command]
pub async fn ban_user(twitch: State<'_, Twitch>, params: BanUserParams) -> Result<Ban> {
    moderation::ban_user(&twitch.authed().await?, params).await
}

#[tauri::command]
pub async fn unban_user(twitch: State<'_, Twitch>, params: UnbanUserParams) -> Result<()> {
    moderation::unban_user(&twitch.authed().await?, params).await
}

#[tauri::command]
pub async fn get_banned_users(
    twitch: State<'_, Twitch>,
    params: GetBannedUsersParams,
) -> Result<PaginatedResponse<BannedUser>> {
    moderation::get_banned_users(&twitch.authed().await?, params).await
}

#[tauri::command]
pub async fn get_moderators(
    twitch: State<'_, Twitch>,
    params: GetModeratorsParams,
) -> Result<PaginatedResponse<UserRef>> {
    moderation::get_moderators(&twitch.authed().await?, params).await
}

#[tauri::command]
pub async fn get_moderated_channels(twitch: State<'_, Twitch>) -> Result<Vec<UserRef>> {
    moderation::get_moderated_channels(&twitch.authed().await?).await
}

#[tauri::command]
pub async fn warn_user(twitch: State<'_, Twitch>, params: WarnUserParams) -> Result<()> {
    moderation::warn_user(&twitch.authed().await?, params).await
}

#[tauri::command]
pub async fn manage_held_automod_message(
    twitch: State<'_, Twitch>,
    params: ManageHeldAutomodMessageParams,
) -> Result<()> {
    moderation::manage_held_automod_message(&twitch.authed().await?, params).await
}
