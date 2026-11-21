use super::dto::Prediction;
use crate::error::Result;
use crate::twitch::params::BroadcasterParams;
use crate::twitch::predictions::{self, CreatePredictionParams, EndPredictionParams};
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_active_prediction(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Option<Prediction>> {
    predictions::get_active_prediction(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn create_prediction(
    twitch: State<'_, Twitch>,
    params: CreatePredictionParams,
) -> Result<()> {
    predictions::create_prediction(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn end_prediction(twitch: State<'_, Twitch>, params: EndPredictionParams) -> Result<()> {
    predictions::end_prediction(&twitch.authed().await?, params).await
}
