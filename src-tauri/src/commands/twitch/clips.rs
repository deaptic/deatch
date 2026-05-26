use crate::dto::twitch::clip::CreatedClip;
use crate::services;
use crate::services::twitch::get_token;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateClipParams {
    pub broadcaster_id: String,
    pub title: Option<String>,
    pub duration: Option<f64>,
}

#[tauri::command]
pub async fn create_clip(
    app: tauri::AppHandle,
    params: CreateClipParams,
) -> Result<CreatedClip, String> {
    let token = get_token(&app).await?;
    services::twitch::clips::create_clip(
        &token,
        params.broadcaster_id,
        params.title,
        params.duration,
    )
    .await
}
