use super::dto::Cheermote;
use crate::error::Result;
use crate::twitch::bits;
use crate::twitch::params::BroadcasterParams;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_cheermotes(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Vec<Cheermote>> {
    bits::get_cheermotes(&twitch.authed().await?, params).await
}
