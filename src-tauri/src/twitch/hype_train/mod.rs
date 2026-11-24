pub mod commands;
pub mod dto;

use super::Authed;
use crate::platform::error::Result;
use crate::twitch::client::params::BroadcasterParams;
use dto::HypeTrain;
use twitch_api::helix::hypetrain::GetHypeTrainStatusRequest;

pub async fn get_hype_train(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Option<HypeTrain>> {
    let request = GetHypeTrainStatusRequest::new(params.broadcaster_id.as_str());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.current.map(HypeTrain::from))
}
