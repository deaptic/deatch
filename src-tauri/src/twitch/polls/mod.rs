pub mod commands;
pub mod dto;

use super::Authed;
use crate::platform::error::Result;
use crate::twitch::client::ids::{PollId, UserId};
use crate::twitch::client::params::BroadcasterParams;
use dto::Poll;
use serde::Deserialize;
use twitch_api::helix::polls::{
    end_poll::{EndPollBody, EndPollRequest},
    CreatePollBody, CreatePollRequest, GetPollsRequest, NewPollChoice,
};
use twitch_api::types::PollStatus;

pub async fn get_active_poll(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Option<Poll>> {
    let request = GetPollsRequest::broadcaster_id(params.broadcaster_id.as_str());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    response
        .data
        .into_iter()
        .find(|p| p.status == PollStatus::Active)
        .map(Poll::try_from)
        .transpose()
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CreatePollParams {
    pub broadcaster_id: UserId,
    pub title: String,
    pub choices: Vec<String>,
    pub duration_seconds: u32,
}

pub async fn create_poll(twitch: &Authed<'_>, params: CreatePollParams) -> Result<()> {
    let choices: Vec<NewPollChoice> = params
        .choices
        .iter()
        .map(|c| NewPollChoice::new(c.as_str()))
        .collect();
    let body = CreatePollBody::new(
        params.broadcaster_id.as_str(),
        params.title.as_str(),
        params.duration_seconds.into(),
        choices,
    );
    twitch
        .helix
        .req_post(CreatePollRequest::new(), body, &twitch.token)
        .await?;
    Ok(())
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EndPollParams {
    pub broadcaster_id: UserId,
    pub poll_id: PollId,
}

pub async fn end_poll(twitch: &Authed<'_>, params: EndPollParams) -> Result<()> {
    let body = EndPollBody::new(
        params.broadcaster_id.as_str(),
        params.poll_id.as_str(),
        PollStatus::Terminated,
    );
    twitch
        .helix
        .req_patch(EndPollRequest::new(), body, &twitch.token)
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{CreatePollParams, EndPollParams};
    use serde_json::json;

    #[test]
    fn create_poll_params_are_camel_case() {
        let params: CreatePollParams = serde_json::from_value(json!({
            "broadcasterId": "1",
            "title": "Heads or tails?",
            "choices": ["Heads", "Tails"],
            "durationSeconds": 60,
        }))
        .unwrap();
        assert_eq!(params.choices, ["Heads", "Tails"]);
        assert_eq!(params.duration_seconds, 60);
    }

    #[test]
    fn end_poll_params_name_the_poll() {
        let params: EndPollParams =
            serde_json::from_value(json!({ "broadcasterId": "1", "pollId": "p1" })).unwrap();
        assert_eq!(params.poll_id.as_str(), "p1");
    }
}
