use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::moderation::{Ban, BannedUser};
use crate::dto::twitch::user::UserRef;
use crate::error::Result;
use crate::services;
use crate::services::twitch::Twitch;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteChatMessagesParams {
    pub broadcaster_id: String,
    pub message_id: Option<String>,
}

#[tauri::command]
pub async fn delete_chat_messages(
    twitch: State<'_, Twitch>,
    params: DeleteChatMessagesParams,
) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::moderation::delete_chat_messages(
        &twitch,
        params.broadcaster_id,
        params.message_id,
    )
    .await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BanUserParams {
    pub broadcaster_id: String,
    pub user_id: String,
    #[serde(default)]
    pub duration: Option<u32>,
    #[serde(default)]
    pub reason: Option<String>,
}

#[tauri::command]
pub async fn ban_user(twitch: State<'_, Twitch>, params: BanUserParams) -> Result<Ban> {
    let twitch = twitch.authed().await?;
    services::twitch::moderation::ban_user(
        &twitch,
        params.broadcaster_id,
        params.user_id,
        params.duration,
        params.reason,
    )
    .await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetBannedUsersParams {
    pub broadcaster_id: String,
    pub user_id: Option<String>,
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_banned_users(
    twitch: State<'_, Twitch>,
    params: GetBannedUsersParams,
) -> Result<PaginatedResponse<BannedUser>> {
    let twitch = twitch.authed().await?;
    services::twitch::moderation::get_banned_users(
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
pub struct UnbanUserParams {
    pub broadcaster_id: String,
    pub user_id: String,
}

#[tauri::command]
pub async fn unban_user(twitch: State<'_, Twitch>, params: UnbanUserParams) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::moderation::unban_user(&twitch, params.broadcaster_id, params.user_id).await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetModeratorsParams {
    pub broadcaster_id: String,
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_moderators(
    twitch: State<'_, Twitch>,
    params: GetModeratorsParams,
) -> Result<PaginatedResponse<UserRef>> {
    let twitch = twitch.authed().await?;
    services::twitch::moderation::get_moderators(
        &twitch,
        params.broadcaster_id,
        params.first,
        params.after,
    )
    .await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetModeratedChannelsParams {
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_moderated_channels(
    twitch: State<'_, Twitch>,
    params: GetModeratedChannelsParams,
) -> Result<PaginatedResponse<UserRef>> {
    let twitch = twitch.authed().await?;
    services::twitch::moderation::get_moderated_channels(&twitch, params.first, params.after).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarnUserParams {
    pub broadcaster_id: String,
    pub user_id: String,
    pub reason: String,
}

#[tauri::command]
pub async fn warn_user(twitch: State<'_, Twitch>, params: WarnUserParams) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::moderation::warn_user(
        &twitch,
        params.broadcaster_id,
        params.user_id,
        params.reason,
    )
    .await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManageHeldAutomodMessageParams {
    pub msg_id: String,
}

#[tauri::command]
pub async fn approve_held_automod_message(
    twitch: State<'_, Twitch>,
    params: ManageHeldAutomodMessageParams,
) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::moderation::manage_held_automod_message(&twitch, params.msg_id, true).await
}

#[tauri::command]
pub async fn deny_held_automod_message(
    twitch: State<'_, Twitch>,
    params: ManageHeldAutomodMessageParams,
) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::moderation::manage_held_automod_message(&twitch, params.msg_id, false).await
}
