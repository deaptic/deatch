use crate::dto::external::emote::EmoteEntry;
use crate::services;

#[tauri::command]
pub async fn ffz_get_global_emotes() -> Result<Vec<EmoteEntry>, String> {
    services::external::ffz::get_global_emotes().await
}

#[tauri::command]
pub async fn ffz_get_channel_emotes(channel_login: String) -> Result<Vec<EmoteEntry>, String> {
    services::external::ffz::get_channel_emotes(channel_login).await
}
