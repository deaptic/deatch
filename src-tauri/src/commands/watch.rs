use serde::Deserialize;

use crate::ipc;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetMutedParams {
    pub channel: String,
    pub muted: bool,
}

#[tauri::command]
pub async fn watch_set_muted(params: SetMutedParams) -> Result<(), String> {
    ipc::set_muted(&params.channel, params.muted)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn watch_request_state() -> Result<(), String> {
    ipc::request_state().await.map_err(|e| e.to_string())
}
