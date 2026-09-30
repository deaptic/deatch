use serde::Deserialize;

use crate::error::Result;
use crate::ipc;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetMutedParams {
    pub channel: String,
    pub muted: bool,
}

#[tauri::command]
pub async fn watch_set_muted(params: SetMutedParams) -> Result<()> {
    Ok(ipc::set_muted(&params.channel, params.muted).await?)
}

#[tauri::command]
pub async fn watch_request_state() -> Result<()> {
    Ok(ipc::request_state().await?)
}
