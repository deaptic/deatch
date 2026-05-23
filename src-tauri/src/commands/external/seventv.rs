use crate::dto::external::emote::EmoteEntry;
use crate::dto::external::seventv::ChannelResult;
use crate::services;
use serde::Deserialize;

#[tauri::command]
pub async fn seventv_get_global_emotes() -> Result<Vec<EmoteEntry>, String> {
    services::external::seventv::get_global_emotes().await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SeventvGetChannelEmotesParams {
    pub channel_id: String,
}

#[tauri::command]
pub async fn seventv_get_channel_emotes(
    params: SeventvGetChannelEmotesParams,
) -> Result<ChannelResult, String> {
    services::external::seventv::get_channel_emotes(params.channel_id).await
}
