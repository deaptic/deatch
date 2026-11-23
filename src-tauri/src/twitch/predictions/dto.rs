use crate::platform::clock::rfc3339_after;
use crate::platform::error::{Error, Result};
use crate::twitch::client::ids::{PredictionId, PredictionOutcomeId};
use crate::twitch::polls::dto::count;
use serde::Serialize;
use twitch_api::helix::predictions::Prediction as HelixPrediction;
use twitch_api::types::{PredictionOutcome as HelixPredictionOutcome, PredictionStatus};

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Prediction {
    pub id: PredictionId,
    pub title: String,
    pub phase: PredictionPhase,
    pub outcomes: Vec<PredictionOutcome>,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum PredictionPhase {
    Open { locks_at: String },
    Locked,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PredictionOutcome {
    pub id: PredictionOutcomeId,
    pub title: String,
    pub channel_points: u64,
    pub users: u64,
}

impl TryFrom<HelixPrediction> for Prediction {
    type Error = Error;

    fn try_from(p: HelixPrediction) -> Result<Self> {
        let phase = match p.status {
            PredictionStatus::Locked => PredictionPhase::Locked,
            _ => PredictionPhase::Open {
                locks_at: rfc3339_after(p.created_at.as_str(), p.prediction_window)?,
            },
        };
        Ok(Self {
            id: PredictionId::from(p.id.to_string()),
            title: p.title,
            phase,
            outcomes: p
                .outcomes
                .into_iter()
                .map(PredictionOutcome::from)
                .collect(),
        })
    }
}

impl From<HelixPredictionOutcome> for PredictionOutcome {
    fn from(o: HelixPredictionOutcome) -> Self {
        Self {
            id: PredictionOutcomeId::from(o.id),
            title: o.title,
            channel_points: count(o.channel_points),
            users: count(o.users),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::Prediction;
    use serde_json::{json, Value};
    use twitch_api::helix::predictions::Prediction as HelixPrediction;

    fn prediction(status: &str) -> Value {
        let helix: HelixPrediction = serde_json::from_value(json!({
            "id": "pr1",
            "broadcaster_id": "1",
            "broadcaster_name": "Broadcaster",
            "broadcaster_login": "broadcaster",
            "title": "Win?",
            "winning_outcome_id": null,
            "outcomes": [{
                "id": "o1",
                "title": "Yes",
                "users": 2,
                "channel_points": 500,
                "top_predictors": null,
                "color": "BLUE"
            }],
            "prediction_window": 120,
            "status": status,
            "created_at": "2021-04-28T16:03:06Z",
            "ended_at": null,
            "locked_at": null
        }))
        .unwrap();
        serde_json::to_value(Prediction::try_from(helix).unwrap()).unwrap()
    }

    #[test]
    fn an_active_prediction_is_open_until_its_window_closes() {
        assert_eq!(
            prediction("ACTIVE"),
            json!({
                "id": "pr1",
                "title": "Win?",
                "phase": { "kind": "open", "locksAt": "2021-04-28T16:05:06Z" },
                "outcomes": [{ "id": "o1", "title": "Yes", "channelPoints": 500, "users": 2 }]
            })
        );
    }

    #[test]
    fn a_locked_prediction_has_no_lock_time() {
        assert_eq!(prediction("LOCKED")["phase"], json!({ "kind": "locked" }));
    }
}
