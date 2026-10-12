pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use crate::twitch::params::BroadcasterParams;
use dto::Cheermote;
use twitch_api::helix::bits::GetCheermotesRequest;

pub async fn get_cheermotes(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Vec<Cheermote>> {
    let request = GetCheermotesRequest::broadcaster_id(params.broadcaster_id.as_str());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(Cheermote::from).collect())
}
