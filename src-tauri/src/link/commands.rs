use tauri::State;

use super::ipc::Hosts;
use super::{
    ClaimDropsParams, LinkChannelParams, RedeemParams, SetCompressorParams, SetGainParams,
    SetMutedParams,
};
use crate::platform::error::Result;

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
pub async fn link_claim_bonus(hosts: State<'_, Hosts>, params: LinkChannelParams) -> Result<()> {
    super::claim_bonus(&hosts, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn link_redeem(hosts: State<'_, Hosts>, params: RedeemParams) -> Result<()> {
    super::redeem(&hosts, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn link_claim_drops(hosts: State<'_, Hosts>, params: ClaimDropsParams) -> Result<()> {
    super::claim_drops(&hosts, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn link_set_compressor(
    hosts: State<'_, Hosts>,
    params: SetCompressorParams,
) -> Result<()> {
    super::set_compressor(&hosts, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn link_close(hosts: State<'_, Hosts>, params: LinkChannelParams) -> Result<()> {
    super::close(&hosts, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn link_set_gain(hosts: State<'_, Hosts>, params: SetGainParams) -> Result<()> {
    super::set_gain(&hosts, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn link_request_state(app: tauri::AppHandle, hosts: State<'_, Hosts>) -> Result<()> {
    super::request_state(&app, &hosts).await
}
