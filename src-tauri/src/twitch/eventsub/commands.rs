use super::EventKind;
use crate::error::Result;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubscribeParams {
    pub broadcaster_id: String,
    pub kind: EventKind,
}

#[tauri::command]
pub async fn subscribe(app: tauri::AppHandle, params: SubscribeParams) -> Result<()> {
    super::subscribe(&app, params.broadcaster_id, params.kind).await
}

#[tauri::command]
pub async fn unsubscribe(app: tauri::AppHandle, params: SubscribeParams) -> Result<()> {
    super::unsubscribe(&app, params.broadcaster_id, params.kind).await
}
