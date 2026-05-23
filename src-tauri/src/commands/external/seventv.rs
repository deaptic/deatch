use crate::dto::external::emote::EmoteEntry;
use crate::dto::external::seventv::ChannelResult;
use crate::services;

#[tauri::command]
pub async fn seventv_get_global_emotes() -> Result<Vec<EmoteEntry>, String> {
    services::external::seventv::get_global_emotes().await
}

#[tauri::command]
pub async fn seventv_get_channel_emotes(channel_id: String) -> Result<ChannelResult, String> {
    services::external::seventv::get_channel_emotes(channel_id).await
}
