use super::dto::AppStats;
use super::Monitor;
use crate::error::Result;
use crate::twitch::Twitch;
use tauri::Manager;

#[tauri::command]
#[specta::specta]
pub async fn get_app_stats(app: tauri::AppHandle) -> Result<AppStats> {
    let stats = tauri::async_runtime::spawn_blocking(move || {
        super::stats(&app.state::<Monitor>(), &app.state::<Twitch>())
    })
    .await?;
    Ok(stats)
}
