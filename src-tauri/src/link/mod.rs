pub mod bridge;
pub mod commands;
pub mod events;
pub mod host;
pub mod ipc;

use serde::Deserialize;

use crate::platform::error::Result;
use ipc::{HostCommand, Hosts};

pub const MAX_MESSAGE_SIZE: usize = 1_048_576;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetMutedParams {
    pub channel: String,
    pub muted: bool,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetGainParams {
    pub channel: String,
    pub gain: f64,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RedeemParams {
    pub channel: String,
    pub reward: String,
    pub cost: u64,
    pub text: Option<String>,
    pub request: String,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetCompressorParams {
    pub on: bool,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ClaimDropsParams {
    pub channel: String,
    pub request: String,
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

pub async fn claim_bonus(hosts: &Hosts, params: LinkChannelParams) -> Result<()> {
    let channel = params.channel;
    Ok(hosts.send(&HostCommand::ClaimBonus { channel }).await?)
}

pub async fn redeem(hosts: &Hosts, params: RedeemParams) -> Result<()> {
    let RedeemParams {
        channel,
        reward,
        cost,
        text,
        request,
    } = params;
    Ok(hosts
        .send(&HostCommand::Redeem {
            channel,
            reward,
            cost,
            text,
            request,
        })
        .await?)
}

pub async fn claim_drops(hosts: &Hosts, params: ClaimDropsParams) -> Result<()> {
    let ClaimDropsParams { channel, request } = params;
    Ok(hosts
        .send(&HostCommand::ClaimDrops { channel, request })
        .await?)
}

pub async fn close(hosts: &Hosts, params: LinkChannelParams) -> Result<()> {
    let channel = params.channel;
    Ok(hosts.send(&HostCommand::Close { channel }).await?)
}

pub async fn set_gain(hosts: &Hosts, params: SetGainParams) -> Result<()> {
    let SetGainParams { channel, gain } = params;
    Ok(hosts.send(&HostCommand::SetGain { channel, gain }).await?)
}

pub async fn set_compressor(hosts: &Hosts, params: SetCompressorParams) -> Result<()> {
    let on = params.on;
    Ok(hosts.send(&HostCommand::SetCompressor { on }).await?)
}

pub async fn request_state(app: &tauri::AppHandle, hosts: &Hosts) -> Result<()> {
    hosts.replay(app).await;
    hosts.send_if_connected(&HostCommand::GetState).await?;
    Ok(())
}
