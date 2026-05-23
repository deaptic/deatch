use crate::dto::twitch::moderation::{Ban, BannedUser};
use crate::dto::twitch::user::UserRef;
use crate::services;
use crate::dto::pagination::PaginatedResponse;
use crate::services::twitch::get_token;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteChatMessagesParams {
    pub broadcaster_id: String,
    pub message_id: Option<String>,
}

#[tauri::command]
pub async fn delete_chat_messages(
    app: tauri::AppHandle,
    params: DeleteChatMessagesParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::moderation::delete_chat_messages(
        &token,
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
pub async fn ban_user(app: tauri::AppHandle, params: BanUserParams) -> Result<Ban, String> {
    let token = get_token(&app).await?;
    services::twitch::moderation::ban_user(
        &token,
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
    app: tauri::AppHandle,
    params: GetBannedUsersParams,
) -> Result<PaginatedResponse<BannedUser>, String> {
    let token = get_token(&app).await?;
    services::twitch::moderation::get_banned_users(
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
pub struct UnbanUserParams {
    pub broadcaster_id: String,
    pub user_id: String,
}

#[tauri::command]
pub async fn unban_user(app: tauri::AppHandle, params: UnbanUserParams) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::moderation::unban_user(&token, params.broadcaster_id, params.user_id).await
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
    app: tauri::AppHandle,
    params: GetModeratorsParams,
) -> Result<PaginatedResponse<UserRef>, String> {
    let token = get_token(&app).await?;
    services::twitch::moderation::get_moderators(
        &token,
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
    app: tauri::AppHandle,
    params: GetModeratedChannelsParams,
) -> Result<PaginatedResponse<UserRef>, String> {
    let token = get_token(&app).await?;
    services::twitch::moderation::get_moderated_channels(&token, params.first, params.after).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarnUserParams {
    pub broadcaster_id: String,
    pub user_id: String,
    pub reason: String,
}

#[tauri::command]
pub async fn warn_user(app: tauri::AppHandle, params: WarnUserParams) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::moderation::warn_user(
        &token,
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
    app: tauri::AppHandle,
    params: ManageHeldAutomodMessageParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::moderation::manage_held_automod_message(&token, params.msg_id, true).await
}

#[tauri::command]
pub async fn deny_held_automod_message(
    app: tauri::AppHandle,
    params: ManageHeldAutomodMessageParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::moderation::manage_held_automod_message(&token, params.msg_id, false).await
}
