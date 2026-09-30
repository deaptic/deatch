use crate::dto::external::emote::EmoteEntry;
use crate::error::Result;
use crate::services;
use serde::Deserialize;
use tauri::State;

#[tauri::command]
pub async fn bttv_get_global_emotes(http: State<'_, reqwest::Client>) -> Result<Vec<EmoteEntry>> {
    services::external::bttv::get_global_emotes(&http).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BttvGetChannelEmotesParams {
    pub channel_id: String,
}

#[tauri::command]
pub async fn bttv_get_channel_emotes(
    http: State<'_, reqwest::Client>,
    params: BttvGetChannelEmotesParams,
) -> Result<Vec<EmoteEntry>> {
    services::external::bttv::get_channel_emotes(&http, params.channel_id).await
}
