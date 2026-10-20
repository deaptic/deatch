use serde::Deserialize;
use std::collections::BTreeMap;
use tauri::State;

use super::ipc::{Compressor, HostCommand, Hosts};
use crate::error::Result;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetMutedParams {
    pub channel: String,
    pub muted: bool,
}

/// Audio processing for the Twitch tabs: the compressor, on or off with its
/// controls, and a gain per channel login (1 is unchanged).
#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetAudioParams {
    pub enabled: bool,
    pub compressor: Compressor,
    pub gains: BTreeMap<String, f64>,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LinkChannelParams {
    pub channel: String,
}

#[tauri::command]
#[specta::specta]
pub async fn link_set_muted(hosts: State<'_, Hosts>, params: SetMutedParams) -> Result<()> {
    let SetMutedParams { channel, muted } = params;
    Ok(hosts
        .send(&HostCommand::SetMuted { channel, muted })
        .await?)
}

#[tauri::command]
#[specta::specta]
pub async fn link_focus(hosts: State<'_, Hosts>, params: LinkChannelParams) -> Result<()> {
    let channel = params.channel;
    Ok(hosts.send(&HostCommand::Focus { channel }).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn link_close(hosts: State<'_, Hosts>, params: LinkChannelParams) -> Result<()> {
    let channel = params.channel;
    Ok(hosts.send(&HostCommand::Close { channel }).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn link_set_audio(hosts: State<'_, Hosts>, params: SetAudioParams) -> Result<()> {
    Ok(hosts
        .set_audio(params.enabled, params.compressor, params.gains)
        .await?)
}

#[tauri::command]
#[specta::specta]
pub async fn link_request_state(hosts: State<'_, Hosts>) -> Result<()> {
    Ok(hosts.send(&HostCommand::GetState).await?)
}
