pub mod bridge;
pub mod commands;
pub mod events;
pub mod host;
pub mod ipc;

use serde::Deserialize;
use std::collections::BTreeMap;

use crate::error::Result;
use ipc::{Compressor, HostCommand, Hosts};

pub const MAX_MESSAGE_SIZE: usize = 1_048_576;

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

pub async fn set_muted(hosts: &Hosts, params: SetMutedParams) -> Result<()> {
    let SetMutedParams { channel, muted } = params;
    Ok(hosts
        .send(&HostCommand::SetMuted { channel, muted })
        .await?)
}

pub async fn focus(hosts: &Hosts, params: LinkChannelParams) -> Result<()> {
    let channel = params.channel;
    Ok(hosts.send(&HostCommand::Focus { channel }).await?)
}

pub async fn close(hosts: &Hosts, params: LinkChannelParams) -> Result<()> {
    let channel = params.channel;
    Ok(hosts.send(&HostCommand::Close { channel }).await?)
}

pub async fn set_audio(hosts: &Hosts, params: SetAudioParams) -> Result<()> {
    Ok(hosts
        .set_audio(params.enabled, params.compressor, params.gains)
        .await?)
}

/// Asks connected browsers to report; one that connects later reports on its
/// own, so none being connected is not a failure.
pub async fn request_state(hosts: &Hosts) -> Result<()> {
    hosts.send_if_connected(&HostCommand::GetState).await?;
    Ok(())
}
