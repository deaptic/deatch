use super::dto::AppStats;
use super::Monitor;
use crate::blocking;
use crate::error::Result;
use crate::twitch::Twitch;
use tauri::Manager;

#[tauri::command]
#[specta::specta]
pub async fn get_app_stats(app: tauri::AppHandle) -> Result<AppStats> {
    blocking::run(app, |app| {
        super::stats(&app.state::<Monitor>(), &app.state::<Twitch>())
    })
    .await
}
