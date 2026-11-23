pub mod commands;
pub mod dto;

use super::broadcaster_endpoint::{self, BroadcasterEndpoint};
use super::Authed;
use crate::error::Result;
use crate::twitch::params::BroadcasterParams;
use dto::{AdSchedule, HelixAdSchedule};
use twitch_api::twitch_oauth2::{validator, Scope, Validator};

struct AdScheduleEndpoint;

impl BroadcasterEndpoint for AdScheduleEndpoint {
    const PATH: &'static str = "channels/ads";
    const SCOPE: Validator = validator![any(Scope::ChannelReadAds, Scope::ChannelManageAds)];
    type Response = Vec<HelixAdSchedule>;
}

struct SnoozeNextAd;

impl BroadcasterEndpoint for SnoozeNextAd {
    const PATH: &'static str = "channels/ads/schedule/snooze";
    const SCOPE: Validator = validator![Scope::ChannelManageAds];
    type Response = Vec<serde_json::Value>;
}

pub async fn get_ad_schedule(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Option<AdSchedule>> {
    let schedules =
        broadcaster_endpoint::get::<AdScheduleEndpoint>(twitch, params.broadcaster_id.as_str())
            .await?;
    Ok(schedules.into_iter().next().map(AdSchedule::from))
}

pub async fn snooze_next_ad(twitch: &Authed<'_>, params: BroadcasterParams) -> Result<()> {
    broadcaster_endpoint::post::<SnoozeNextAd>(twitch, params.broadcaster_id.as_str()).await
}
