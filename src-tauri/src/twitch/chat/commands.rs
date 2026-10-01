use super::dto::{BadgeSet, ChatSettings, Emote, SendMessageResult, UserEmote};
use crate::error::Result;
use crate::twitch::chat::{
    self, GetChannelChatBadgesParams, GetChatSettingsParams, SendChatAnnouncementParams,
    SendChatMessageParams, SendShoutoutParams, UpdateChatSettingsParams, UpdateUserChatColorParams,
};
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_global_emotes(twitch: State<'_, Twitch>) -> Result<Vec<Emote>> {
    chat::get_global_emotes(&twitch.authed().await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_user_emotes(twitch: State<'_, Twitch>) -> Result<Vec<UserEmote>> {
    chat::get_user_emotes(&twitch.authed().await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_global_chat_badges(twitch: State<'_, Twitch>) -> Result<Vec<BadgeSet>> {
    chat::get_global_chat_badges(&twitch.authed().await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_channel_chat_badges(
    twitch: State<'_, Twitch>,
    params: GetChannelChatBadgesParams,
) -> Result<Vec<BadgeSet>> {
    chat::get_channel_chat_badges(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn send_shoutout(twitch: State<'_, Twitch>, params: SendShoutoutParams) -> Result<()> {
    chat::send_shoutout(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn send_chat_message(
    twitch: State<'_, Twitch>,
    params: SendChatMessageParams,
) -> Result<SendMessageResult> {
    chat::send_chat_message(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn send_chat_announcement(
    twitch: State<'_, Twitch>,
    params: SendChatAnnouncementParams,
) -> Result<()> {
    chat::send_chat_announcement(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_chat_settings(
    twitch: State<'_, Twitch>,
    params: GetChatSettingsParams,
) -> Result<ChatSettings> {
    chat::get_chat_settings(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn update_chat_settings(
    twitch: State<'_, Twitch>,
    params: UpdateChatSettingsParams,
) -> Result<()> {
    chat::update_chat_settings(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn update_user_chat_color(
    twitch: State<'_, Twitch>,
    params: UpdateUserChatColorParams,
) -> Result<()> {
    chat::update_user_chat_color(&twitch.authed().await?, params).await
}
