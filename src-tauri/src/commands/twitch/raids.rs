use crate::error::Result;
use crate::services;
use crate::services::twitch::Twitch;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartRaidParams {
    pub from_broadcaster_id: String,
    pub to_broadcaster_id: String,
}

#[tauri::command]
pub async fn start_raid(twitch: State<'_, Twitch>, params: StartRaidParams) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::raids::start_raid(
        &twitch,
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
pub async fn cancel_raid(twitch: State<'_, Twitch>, params: CancelRaidParams) -> Result<()> {
    let twitch = twitch.authed().await?;
    services::twitch::raids::cancel_raid(&twitch, params.broadcaster_id).await
}
