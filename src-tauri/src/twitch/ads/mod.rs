pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use crate::twitch::params::BroadcasterParams;
use dto::{AdSchedule, HelixAdSchedule};
use serde::Serialize;
use twitch_api::helix::{EmptyBody, Request, RequestGet, RequestPost};
use twitch_api::twitch_oauth2::{validator, Scope, Validator};

#[derive(Serialize)]
struct GetAdScheduleRequest<'a> {
    broadcaster_id: &'a str,
}

impl Request for GetAdScheduleRequest<'_> {
    type PaginationData = ();
    type Response = Vec<HelixAdSchedule>;

    const PATH: &'static str = "channels/ads";
    const SCOPE: Validator = validator![any(Scope::ChannelReadAds, Scope::ChannelManageAds)];
}

impl RequestGet for GetAdScheduleRequest<'_> {}

#[derive(Serialize)]
struct SnoozeNextAdRequest<'a> {
    broadcaster_id: &'a str,
}

impl Request for SnoozeNextAdRequest<'_> {
    type PaginationData = ();
    type Response = Vec<serde_json::Value>;

    const PATH: &'static str = "channels/ads/schedule/snooze";
    const SCOPE: Validator = validator![Scope::ChannelManageAds];
}

impl RequestPost for SnoozeNextAdRequest<'_> {
    type Body = EmptyBody;
}

pub async fn get_ad_schedule(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Option<AdSchedule>> {
    let request = GetAdScheduleRequest {
        broadcaster_id: params.broadcaster_id.as_str(),
    };
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().next().map(AdSchedule::from))
}

pub async fn snooze_next_ad(twitch: &Authed<'_>, params: BroadcasterParams) -> Result<()> {
    let request = SnoozeNextAdRequest {
        broadcaster_id: params.broadcaster_id.as_str(),
    };
    twitch
        .helix
        .req_post(request, EmptyBody, &twitch.token)
        .await?;
    Ok(())
}
