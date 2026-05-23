use crate::dto::external::emote::EmoteEntry;
use crate::services;
use serde::Deserialize;

#[tauri::command]
pub async fn bttv_get_global_emotes() -> Result<Vec<EmoteEntry>, String> {
    services::external::bttv::get_global_emotes().await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BttvGetChannelEmotesParams {
    pub channel_id: String,
}

#[tauri::command]
pub async fn bttv_get_channel_emotes(
    params: BttvGetChannelEmotesParams,
) -> Result<Vec<EmoteEntry>, String> {
    services::external::bttv::get_channel_emotes(params.channel_id).await
}
