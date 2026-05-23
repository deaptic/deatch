use crate::dto::twitch::chat::{BadgeSet, Emote, SendMessageResult, UserEmote};
use crate::services;
use crate::services::twitch::chat::ChatSettings;
use crate::dto::pagination::PaginatedResponse;
use crate::services::twitch::get_token;
use serde::Deserialize;

#[tauri::command]
pub async fn get_global_emotes(app: tauri::AppHandle) -> Result<Vec<Emote>, String> {
    let token = get_token(&app).await?;
    services::twitch::chat::get_global_emotes(&token).await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetUserEmotesParams {
    pub broadcaster_id: Option<String>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_user_emotes(
    app: tauri::AppHandle,
    params: GetUserEmotesParams,
) -> Result<PaginatedResponse<UserEmote>, String> {
    let token = get_token(&app).await?;
    services::twitch::chat::get_user_emotes(&token, params.broadcaster_id, params.after).await
}

#[tauri::command]
pub async fn get_global_chat_badges(app: tauri::AppHandle) -> Result<Vec<BadgeSet>, String> {
    let token = get_token(&app).await?;
    services::twitch::chat::get_global_chat_badges(&token).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetChannelChatBadgesParams {
    pub broadcaster_id: String,
}

#[tauri::command]
pub async fn get_channel_chat_badges(
    app: tauri::AppHandle,
    params: GetChannelChatBadgesParams,
) -> Result<Vec<BadgeSet>, String> {
    let token = get_token(&app).await?;
    services::twitch::chat::get_channel_chat_badges(&token, params.broadcaster_id).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendShoutoutParams {
    pub from_broadcaster_id: String,
    pub to_broadcaster_id: String,
}

#[tauri::command]
pub async fn send_shoutout(
    app: tauri::AppHandle,
    params: SendShoutoutParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::chat::send_shoutout(
        &token,
        params.from_broadcaster_id,
        params.to_broadcaster_id,
    )
    .await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendChatMessageParams {
    pub broadcaster_id: String,
    pub message: String,
    pub reply_parent_message_id: Option<String>,
}

#[tauri::command]
pub async fn send_chat_message(
    app: tauri::AppHandle,
    params: SendChatMessageParams,
) -> Result<SendMessageResult, String> {
    let token = get_token(&app).await?;
    services::twitch::chat::send_chat_message(
        &token,
        params.broadcaster_id,
        params.message,
        params.reply_parent_message_id,
    )
    .await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendChatAnnouncementParams {
    pub broadcaster_id: String,
    pub message: String,
    #[serde(default)]
    pub color: Option<String>,
}

#[tauri::command]
pub async fn send_chat_announcement(
    app: tauri::AppHandle,
    params: SendChatAnnouncementParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::chat::send_chat_announcement(
        &token,
        params.broadcaster_id,
        params.message,
        params.color,
    )
    .await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChatSettingsParams {
    pub broadcaster_id: String,
    #[serde(default)]
    pub emote_mode: Option<bool>,
    #[serde(default)]
    pub follower_mode: Option<bool>,
    #[serde(default)]
    pub follower_mode_duration: Option<u64>,
    #[serde(default)]
    pub slow_mode: Option<bool>,
    #[serde(default)]
    pub slow_mode_wait_time: Option<u64>,
    #[serde(default)]
    pub subscriber_mode: Option<bool>,
    #[serde(default)]
    pub unique_chat_mode: Option<bool>,
}

#[tauri::command]
pub async fn update_chat_settings(
    app: tauri::AppHandle,
    params: UpdateChatSettingsParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    let settings = ChatSettings {
        emote_mode: params.emote_mode,
        follower_mode: params.follower_mode,
        follower_mode_duration: params.follower_mode_duration,
        slow_mode: params.slow_mode,
        slow_mode_wait_time: params.slow_mode_wait_time,
        subscriber_mode: params.subscriber_mode,
        unique_chat_mode: params.unique_chat_mode,
    };
    services::twitch::chat::update_chat_settings(&token, params.broadcaster_id, settings).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserChatColorParams {
    pub color: String,
}

#[tauri::command]
pub async fn update_user_chat_color(
    app: tauri::AppHandle,
    params: UpdateUserChatColorParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::chat::update_user_chat_color(&token, params.color).await
}
