use super::dto::{BadgeSet, ChatSettings, Emote, PinnedMessage, SendMessageResult, UserEmote};
use crate::platform::error::Result;
use crate::twitch::chat::{
    self, GetUserChatColorParams, PinMessageParams, SendChatAnnouncementParams,
    SendChatMessageParams, UnpinMessageParams, UpdateChatSettingsParams, UpdateUserChatColorParams,
};
use crate::twitch::client::params::{BroadcasterPairParams, BroadcasterParams};
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
pub async fn get_follower_emotes(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Vec<UserEmote>> {
    chat::get_follower_emotes(&twitch.authed().await?, params).await
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
    params: BroadcasterParams,
) -> Result<Vec<BadgeSet>> {
    chat::get_channel_chat_badges(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn send_shoutout(twitch: State<'_, Twitch>, params: BroadcasterPairParams) -> Result<()> {
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
    params: BroadcasterParams,
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
pub async fn get_user_chat_color(
    twitch: State<'_, Twitch>,
    params: GetUserChatColorParams,
) -> Result<Option<String>> {
    chat::get_user_chat_color(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn update_user_chat_color(
    twitch: State<'_, Twitch>,
    params: UpdateUserChatColorParams,
) -> Result<()> {
    chat::update_user_chat_color(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn get_pinned_message(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Option<PinnedMessage>> {
    chat::get_pinned_message(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn pin_message(twitch: State<'_, Twitch>, params: PinMessageParams) -> Result<()> {
    chat::pin_message(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn unpin_message(twitch: State<'_, Twitch>, params: UnpinMessageParams) -> Result<()> {
    chat::unpin_message(&twitch.authed().await?, params).await
}
