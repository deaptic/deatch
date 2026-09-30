use crate::dto::twitch::clip::CreatedClip;
use crate::error::Result;
use crate::services;
use crate::services::twitch::Twitch;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateClipParams {
    pub broadcaster_id: String,
    pub title: Option<String>,
    pub duration: Option<f64>,
}

#[tauri::command]
pub async fn create_clip(
    twitch: State<'_, Twitch>,
    params: CreateClipParams,
) -> Result<CreatedClip> {
    let twitch = twitch.authed().await?;
    services::twitch::clips::create_clip(
        &twitch,
        params.broadcaster_id,
        params.title,
        params.duration,
    )
    .await
}
