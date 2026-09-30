use serde::Deserialize;

use super::ipc;
use crate::error::Result;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetMutedParams {
    pub channel: String,
    pub muted: bool,
}

#[tauri::command]
#[specta::specta]
pub async fn watch_set_muted(params: SetMutedParams) -> Result<()> {
    Ok(ipc::set_muted(&params.channel, params.muted).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn watch_request_state() -> Result<()> {
    Ok(ipc::request_state().await?)
}
