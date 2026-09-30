use crate::error::Result;
use crate::services::twitch::raids::{self, CancelRaidParams, StartRaidParams};
use crate::services::twitch::Twitch;
use tauri::State;

#[tauri::command]
pub async fn start_raid(twitch: State<'_, Twitch>, params: StartRaidParams) -> Result<()> {
    raids::start_raid(&twitch.authed().await?, params).await
}

#[tauri::command]
pub async fn cancel_raid(twitch: State<'_, Twitch>, params: CancelRaidParams) -> Result<()> {
    raids::cancel_raid(&twitch.authed().await?, params).await
}
