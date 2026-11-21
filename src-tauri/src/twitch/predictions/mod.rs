pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use crate::twitch::ids::{PredictionId, PredictionOutcomeId, UserId};
use crate::twitch::params::BroadcasterParams;
use dto::Prediction;
use serde::Deserialize;
use twitch_api::helix::predictions::{
    create_prediction::{CreatePredictionBody, CreatePredictionRequest, NewPredictionOutcome},
    end_prediction::{EndPredictionBody, EndPredictionRequest},
    GetPredictionsRequest,
};
use twitch_api::types::PredictionStatus;

pub async fn get_active_prediction(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Option<Prediction>> {
    let request = GetPredictionsRequest::broadcaster_id(params.broadcaster_id.as_str());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    response
        .data
        .into_iter()
        .find(|p| {
            matches!(
                p.status,
                PredictionStatus::Active | PredictionStatus::Locked
            )
        })
        .map(Prediction::try_from)
        .transpose()
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CreatePredictionParams {
    pub broadcaster_id: UserId,
    pub title: String,
    pub outcomes: Vec<String>,
    pub window_seconds: u32,
}

pub async fn create_prediction(twitch: &Authed<'_>, params: CreatePredictionParams) -> Result<()> {
    let outcomes: Vec<NewPredictionOutcome> = params
        .outcomes
        .iter()
        .map(|o| NewPredictionOutcome::new(o.as_str()))
        .collect();
    let body = CreatePredictionBody::new(
        params.broadcaster_id.as_str(),
        params.title.as_str(),
        &outcomes,
        params.window_seconds.into(),
    );
    twitch
        .helix
        .req_post(CreatePredictionRequest::new(), body, &twitch.token)
        .await?;
    Ok(())
}

#[derive(Deserialize, specta::Type)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum PredictionEnd {
    Lock,
    Resolve {
        winning_outcome_id: PredictionOutcomeId,
    },
    Cancel,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EndPredictionParams {
    pub broadcaster_id: UserId,
    pub prediction_id: PredictionId,
    pub end: PredictionEnd,
}

pub async fn end_prediction(twitch: &Authed<'_>, params: EndPredictionParams) -> Result<()> {
    let body = |status| {
        EndPredictionBody::new(
            params.broadcaster_id.as_str(),
            params.prediction_id.as_str(),
            status,
        )
    };
    let body = match &params.end {
        PredictionEnd::Lock => body(PredictionStatus::Locked),
        PredictionEnd::Resolve { winning_outcome_id } => {
            body(PredictionStatus::Resolved).winning_outcome_id(winning_outcome_id.as_str())
        }
        PredictionEnd::Cancel => body(PredictionStatus::Canceled),
    };
    twitch
        .helix
        .req_patch(EndPredictionRequest::new(), body, &twitch.token)
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{CreatePredictionParams, EndPredictionParams, PredictionEnd};
    use serde_json::json;

    fn end(end: serde_json::Value) -> serde_json::Result<PredictionEnd> {
        let params: EndPredictionParams = serde_json::from_value(json!({
            "broadcasterId": "1",
            "predictionId": "pr1",
            "end": end,
        }))?;
        Ok(params.end)
    }

    #[test]
    fn prediction_end_is_tagged_by_kind() {
        assert!(matches!(
            end(json!({ "kind": "lock" })),
            Ok(PredictionEnd::Lock)
        ));
        assert!(matches!(
            end(json!({ "kind": "cancel" })),
            Ok(PredictionEnd::Cancel)
        ));
        match end(json!({ "kind": "resolve", "winningOutcomeId": "o1" })) {
            Ok(PredictionEnd::Resolve { winning_outcome_id }) => {
                assert_eq!(winning_outcome_id.as_str(), "o1")
            }
            _ => panic!("expected resolve"),
        }
        assert!(end(json!({ "kind": "resolve" })).is_err());
        assert!(end(json!({ "kind": "archive" })).is_err());
    }

    #[test]
    fn create_prediction_params_are_camel_case() {
        let params: CreatePredictionParams = serde_json::from_value(json!({
            "broadcasterId": "1",
            "title": "Win?",
            "outcomes": ["Yes", "No"],
            "windowSeconds": 120,
        }))
        .unwrap();
        assert_eq!(params.outcomes, ["Yes", "No"]);
        assert_eq!(params.window_seconds, 120);
    }
}
