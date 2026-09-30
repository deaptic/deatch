use crate::dto::external::emote::EmoteEntry;
use crate::error::Result;
use crate::services;
use serde::Deserialize;
use tauri::State;

#[tauri::command]
pub async fn ffz_get_global_emotes(http: State<'_, reqwest::Client>) -> Result<Vec<EmoteEntry>> {
    services::external::ffz::get_global_emotes(&http).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FfzGetChannelEmotesParams {
    pub channel_login: String,
}

#[tauri::command]
pub async fn ffz_get_channel_emotes(
    http: State<'_, reqwest::Client>,
    params: FfzGetChannelEmotesParams,
) -> Result<Vec<EmoteEntry>> {
    services::external::ffz::get_channel_emotes(&http, params.channel_login).await
}
