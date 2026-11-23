pub mod commands;
pub mod dto;

use super::broadcaster_endpoint::{self, BroadcasterEndpoint};
use super::Authed;
use crate::error::Result;
use crate::twitch::params::BroadcasterParams;
use dto::{Goal, HelixGoal};
use twitch_api::twitch_oauth2::{validator, Scope, Validator};

struct CreatorGoals;

impl BroadcasterEndpoint for CreatorGoals {
    const PATH: &'static str = "goals";
    const SCOPE: Validator = validator![Scope::ChannelReadGoals];
    type Response = Vec<HelixGoal>;
}

pub async fn get_goals(twitch: &Authed<'_>, params: BroadcasterParams) -> Result<Vec<Goal>> {
    let goals =
        broadcaster_endpoint::get::<CreatorGoals>(twitch, params.broadcaster_id.as_str()).await?;
    Ok(goals.into_iter().map(Goal::from).collect())
}
