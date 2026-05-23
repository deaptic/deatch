use crate::services;
use crate::services::twitch::get_token;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartRaidParams {
    pub from_broadcaster_id: String,
    pub to_broadcaster_id: String,
}

#[tauri::command]
pub async fn start_raid(app: tauri::AppHandle, params: StartRaidParams) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::raids::start_raid(
        &token,
        params.from_broadcaster_id,
        params.to_broadcaster_id,
    )
    .await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CancelRaidParams {
    pub broadcaster_id: String,
}

#[tauri::command]
pub async fn cancel_raid(app: tauri::AppHandle, params: CancelRaidParams) -> Result<(), String> {
    let token = get_token(&app).await?;
    services::twitch::raids::cancel_raid(&token, params.broadcaster_id).await
}
