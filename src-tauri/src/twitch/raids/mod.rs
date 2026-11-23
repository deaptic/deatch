pub mod commands;

use super::Authed;
use crate::platform::error::Result;
use crate::twitch::client::params::{BroadcasterPairParams, BroadcasterParams};

pub async fn start_raid(twitch: &Authed<'_>, params: BroadcasterPairParams) -> Result<()> {
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

pub async fn cancel_raid(twitch: &Authed<'_>, params: BroadcasterParams) -> Result<()> {
    twitch
        .helix
        .cancel_a_raid(params.broadcaster_id.as_str(), &twitch.token)
        .await?;
    Ok(())
}
