use super::dto::Goal;
use crate::platform::error::Result;
use crate::twitch::client::params::BroadcasterParams;
use crate::twitch::goals;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_goals(twitch: State<'_, Twitch>, params: BroadcasterParams) -> Result<Vec<Goal>> {
    goals::get_goals(&twitch.authed().await?, params).await
}
