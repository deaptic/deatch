pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use crate::twitch::params::BroadcasterParams;
use dto::{Goal, HelixGoal};
use serde::Serialize;
use twitch_api::helix::{Request, RequestGet};
use twitch_api::twitch_oauth2::{validator, Scope, Validator};

#[derive(Serialize)]
struct GetGoalsRequest<'a> {
    broadcaster_id: &'a str,
}

impl Request for GetGoalsRequest<'_> {
    type PaginationData = ();
    type Response = Vec<HelixGoal>;

    const PATH: &'static str = "goals";
    const SCOPE: Validator = validator![Scope::ChannelReadGoals];
}

impl RequestGet for GetGoalsRequest<'_> {}

pub async fn get_goals(twitch: &Authed<'_>, params: BroadcasterParams) -> Result<Vec<Goal>> {
    let request = GetGoalsRequest {
        broadcaster_id: params.broadcaster_id.as_str(),
    };
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(Goal::from).collect())
}
