use serde::Deserialize;

use super::ipc::{self, HostCommand};
use crate::error::Result;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetMutedParams {
    pub channel: String,
    pub muted: bool,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LinkChannelParams {
    pub channel: String,
}

#[tauri::command]
#[specta::specta]
pub async fn link_set_muted(params: SetMutedParams) -> Result<()> {
    let SetMutedParams { channel, muted } = params;
    Ok(ipc::send_to_host(&HostCommand::SetMuted { channel, muted }).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn link_focus(params: LinkChannelParams) -> Result<()> {
    let channel = params.channel;
    Ok(ipc::send_to_host(&HostCommand::Focus { channel }).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn link_close(params: LinkChannelParams) -> Result<()> {
    let channel = params.channel;
    Ok(ipc::send_to_host(&HostCommand::Close { channel }).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn link_request_state() -> Result<()> {
    Ok(ipc::send_to_host(&HostCommand::GetState).await?)
}
