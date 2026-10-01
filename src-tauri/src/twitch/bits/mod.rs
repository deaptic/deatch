pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use crate::twitch::ids::UserId;
use dto::Cheermote;
use serde::Deserialize;
use twitch_api::helix::bits::GetCheermotesRequest;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetCheermotesParams {
    pub broadcaster_id: UserId,
}

pub async fn get_cheermotes(
    twitch: &Authed<'_>,
    params: GetCheermotesParams,
) -> Result<Vec<Cheermote>> {
    let request = GetCheermotesRequest::broadcaster_id(params.broadcaster_id.as_str());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(Cheermote::from).collect())
}
