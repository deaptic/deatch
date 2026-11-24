use super::dto::HypeTrain;
use crate::platform::error::Result;
use crate::twitch::client::params::BroadcasterParams;
use crate::twitch::hype_train;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_hype_train(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Option<HypeTrain>> {
    hype_train::get_hype_train(&twitch.authed().await?, params).await
}
