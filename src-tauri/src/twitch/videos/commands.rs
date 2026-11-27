use super::dto::LastStream;
use crate::platform::error::Result;
use crate::twitch::client::params::BroadcasterParams;
use crate::twitch::videos;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_last_stream(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Option<LastStream>> {
    videos::last_stream(&twitch.authed().await?, params).await
}
