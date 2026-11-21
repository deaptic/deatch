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
        let browser = app
            .get_webview_window("main")
            .and_then(|webview| super::browser_process_id(&webview));
        super::stats(&app.state::<Monitor>(), &app.state::<Twitch>(), browser)
    })
    .await
}
