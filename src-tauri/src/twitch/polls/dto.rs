use crate::platform::clock::rfc3339_after;
use crate::platform::error::{Error, Result};
use crate::twitch::client::ids::PollId;
use serde::Serialize;
use twitch_api::helix::polls::Poll as HelixPoll;
use twitch_api::types::PollChoice as HelixPollChoice;

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Poll {
    pub id: PollId,
    pub title: String,
    pub choices: Vec<PollChoice>,
    pub ends_at: String,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PollChoice {
    pub id: String,
    pub title: String,
    pub votes: u64,
}

impl TryFrom<HelixPoll> for Poll {
    type Error = Error;

    fn try_from(p: HelixPoll) -> Result<Self> {
        Ok(Self {
            ends_at: rfc3339_after(p.started_at.as_str(), p.duration)?,
            id: PollId::from(p.id.to_string()),
            title: p.title,
            choices: p.choices.into_iter().map(PollChoice::from).collect(),
        })
    }
}

impl From<HelixPollChoice> for PollChoice {
    fn from(c: HelixPollChoice) -> Self {
        Self {
            id: c.id,
            title: c.title,
            votes: count(c.votes),
        }
    }
}

pub(crate) fn count(value: Option<i64>) -> u64 {
    value.and_then(|v| u64::try_from(v).ok()).unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::Poll;
    use serde_json::json;
    use twitch_api::helix::polls::Poll as HelixPoll;

    #[test]
    fn maps_an_active_poll() {
        let helix: HelixPoll = serde_json::from_value(json!({
            "id": "p1",
            "broadcaster_id": "1",
            "broadcaster_name": "Broadcaster",
            "broadcaster_login": "broadcaster",
            "title": "Heads or Tails?",
            "choices": [
                { "id": "c1", "title": "Heads", "votes": 3, "channel_points_votes": 0 },
                { "id": "c2", "title": "Tails", "votes": null, "channel_points_votes": 0 }
            ],
            "channel_points_voting_enabled": false,
            "channel_points_per_vote": 0,
            "status": "ACTIVE",
            "duration": 60,
            "started_at": "2021-03-19T06:08:33Z"
        }))
        .unwrap();
        assert_eq!(
            serde_json::to_value(Poll::try_from(helix).unwrap()).unwrap(),
            json!({
                "id": "p1",
                "title": "Heads or Tails?",
                "choices": [
                    { "id": "c1", "title": "Heads", "votes": 3 },
                    { "id": "c2", "title": "Tails", "votes": 0 }
                ],
                "endsAt": "2021-03-19T06:09:33Z"
            })
        );
    }
}
