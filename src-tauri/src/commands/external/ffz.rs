use crate::dto::external::emote::EmoteEntry;
use crate::services;
use serde::Deserialize;

#[tauri::command]
pub async fn ffz_get_global_emotes() -> Result<Vec<EmoteEntry>, String> {
    services::external::ffz::get_global_emotes().await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FfzGetChannelEmotesParams {
    pub channel_login: String,
}

#[tauri::command]
pub async fn ffz_get_channel_emotes(
    params: FfzGetChannelEmotesParams,
) -> Result<Vec<EmoteEntry>, String> {
    services::external::ffz::get_channel_emotes(params.channel_login).await
}
