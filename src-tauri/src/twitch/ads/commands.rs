use super::dto::AdSchedule;
use crate::error::Result;
use crate::twitch::ads;
use crate::twitch::params::BroadcasterParams;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_ad_schedule(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Option<AdSchedule>> {
    ads::get_ad_schedule(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn snooze_next_ad(twitch: State<'_, Twitch>, params: BroadcasterParams) -> Result<()> {
    ads::snooze_next_ad(&twitch.authed().await?, params).await
}
