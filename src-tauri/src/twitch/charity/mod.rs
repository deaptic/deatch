pub mod commands;
pub mod dto;

use super::Authed;
use crate::platform::error::Result;
use crate::twitch::client::params::BroadcasterParams;
use dto::CharityCampaign;
use twitch_api::helix::charity::GetCharityCampaignRequest;

pub async fn get_charity_campaign(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Option<CharityCampaign>> {
    let request = GetCharityCampaignRequest::broadcaster_id(params.broadcaster_id.as_str());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().next().map(CharityCampaign::from))
}
