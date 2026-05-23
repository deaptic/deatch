use crate::services;
use crate::services::twitch::eventsub::EventKind;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubscribeParams {
    pub broadcaster_id: String,
    pub kind: EventKind,
}

#[tauri::command]
pub async fn subscribe(app: tauri::AppHandle, params: SubscribeParams) -> Result<(), String> {
    services::twitch::eventsub::subscribe(&app, params.broadcaster_id, params.kind).await
}

#[tauri::command]
pub async fn unsubscribe(app: tauri::AppHandle, params: SubscribeParams) -> Result<(), String> {
    services::twitch::eventsub::unsubscribe(&app, params.broadcaster_id, params.kind).await
}
