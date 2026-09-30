pub mod commands;

use super::Authed;
use crate::error::Result;
use crate::twitch::ids::UserId;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartRaidParams {
    pub from_broadcaster_id: UserId,
    pub to_broadcaster_id: UserId,
}

pub async fn start_raid(twitch: &Authed<'_>, params: StartRaidParams) -> Result<()> {
    twitch
        .helix
        .start_a_raid(
            params.from_broadcaster_id.as_str(),
            params.to_broadcaster_id.as_str(),
            &twitch.token,
        )
        .await?;
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CancelRaidParams {
    pub broadcaster_id: UserId,
}

pub async fn cancel_raid(twitch: &Authed<'_>, params: CancelRaidParams) -> Result<()> {
    twitch
        .helix
        .cancel_a_raid(params.broadcaster_id.as_str(), &twitch.token)
        .await?;
    Ok(())
}
