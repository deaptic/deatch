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
    let line = serde_json::json!({
        "type": "set_muted",
        "channel": params.channel.to_lowercase(),
        "muted": params.muted,
    })
    .to_string();
    ipc::send_to_host(&line).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn watch_request_state() -> Result<(), String> {
    ipc::send_to_host(r#"{"type":"get_state"}"#)
        .await
        .map_err(|e| e.to_string())
}
