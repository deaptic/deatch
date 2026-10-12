use super::dto::AppStats;
use super::Monitor;
use crate::error::Result;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_app_stats(
    monitor: State<'_, Monitor>,
    twitch: State<'_, Twitch>,
) -> Result<AppStats> {
    Ok(super::stats(&monitor, &twitch))
}
