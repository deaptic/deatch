use super::dto::{BannedUser, BlockedTerm, UnbanRequest};
use crate::error::Result;
use crate::twitch::moderation::{
    self, AddBlockedTermParams, BanUserParams, DeleteChatMessagesParams,
    ManageHeldAutomodMessageParams, RemoveBlockedTermParams, ResolveUnbanRequestParams,
    SetSuspiciousStatusParams, UpdateShieldModeParams, WarnUserParams,
};
use crate::twitch::params::{BroadcasterParams, BroadcasterUserParams};
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
pub async fn ban_user(twitch: State<'_, Twitch>, params: BanUserParams) -> Result<()> {
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
pub async fn get_unban_requests(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Vec<UnbanRequest>> {
    moderation::get_unban_requests(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn resolve_unban_request(
    twitch: State<'_, Twitch>,
    params: ResolveUnbanRequestParams,
) -> Result<()> {
    moderation::resolve_unban_request(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn set_suspicious_status(
    twitch: State<'_, Twitch>,
    params: SetSuspiciousStatusParams,
) -> Result<()> {
    moderation::set_suspicious_status(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_blocked_terms(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Vec<BlockedTerm>> {
    moderation::get_blocked_terms(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn add_blocked_term(
    twitch: State<'_, Twitch>,
    params: AddBlockedTermParams,
) -> Result<Option<BlockedTerm>> {
    moderation::add_blocked_term(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn remove_blocked_term(
    twitch: State<'_, Twitch>,
    params: RemoveBlockedTermParams,
) -> Result<()> {
    moderation::remove_blocked_term(&twitch.authed().await?, params).await
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

#[tauri::command]
#[specta::specta]
pub async fn get_shield_mode(twitch: State<'_, Twitch>, params: BroadcasterParams) -> Result<bool> {
    moderation::get_shield_mode(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn update_shield_mode(
    twitch: State<'_, Twitch>,
    params: UpdateShieldModeParams,
) -> Result<bool> {
    moderation::update_shield_mode(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_moderated_channels(twitch: State<'_, Twitch>) -> Result<Vec<UserRef>> {
    moderation::get_moderated_channels(&twitch.authed().await?).await
}
