use tauri::State;

use super::ipc::Hosts;
use super::{LinkChannelParams, SetAudioParams, SetMutedParams};
use crate::error::Result;

#[tauri::command]
#[specta::specta]
pub async fn link_set_muted(hosts: State<'_, Hosts>, params: SetMutedParams) -> Result<()> {
    super::set_muted(&hosts, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn link_focus(hosts: State<'_, Hosts>, params: LinkChannelParams) -> Result<()> {
    super::focus(&hosts, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn link_close(hosts: State<'_, Hosts>, params: LinkChannelParams) -> Result<()> {
    super::close(&hosts, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn link_set_audio(hosts: State<'_, Hosts>, params: SetAudioParams) -> Result<()> {
    super::set_audio(&hosts, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn link_request_state(hosts: State<'_, Hosts>) -> Result<()> {
    super::request_state(&hosts).await
}
