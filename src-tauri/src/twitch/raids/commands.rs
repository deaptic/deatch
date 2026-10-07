use crate::error::Result;
use crate::twitch::params::{BroadcasterPairParams, BroadcasterParams};
use crate::twitch::raids;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn start_raid(twitch: State<'_, Twitch>, params: BroadcasterPairParams) -> Result<()> {
    raids::start_raid(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn cancel_raid(twitch: State<'_, Twitch>, params: BroadcasterParams) -> Result<()> {
    raids::cancel_raid(&twitch.authed().await?, params).await
}
