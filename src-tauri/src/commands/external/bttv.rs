use crate::dto::external::emote::EmoteEntry;
use crate::services;

#[tauri::command]
pub async fn bttv_get_global_emotes() -> Result<Vec<EmoteEntry>, String> {
    services::external::bttv::get_global_emotes().await
}

#[tauri::command]
pub async fn bttv_get_channel_emotes(channel_id: String) -> Result<Vec<EmoteEntry>, String> {
    services::external::bttv::get_channel_emotes(channel_id).await
}
