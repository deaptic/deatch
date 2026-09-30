use crate::dto::external::emote::EmoteEntry;
use crate::dto::external::seventv::ChannelResult;
use crate::error::Result;
use crate::services;
use serde::Deserialize;
use tauri::State;

#[tauri::command]
pub async fn seventv_get_global_emotes(
    http: State<'_, reqwest::Client>,
) -> Result<Vec<EmoteEntry>> {
    services::external::seventv::get_global_emotes(&http).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SeventvGetChannelEmotesParams {
    pub channel_id: String,
}

#[tauri::command]
pub async fn seventv_get_channel_emotes(
    http: State<'_, reqwest::Client>,
    params: SeventvGetChannelEmotesParams,
) -> Result<ChannelResult> {
    services::external::seventv::get_channel_emotes(&http, params.channel_id).await
}
