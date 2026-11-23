use super::{DiscordState, SetActivityParams};
use crate::platform::blocking;
use crate::platform::error::Result;
use tauri::Manager;

#[tauri::command]
#[specta::specta]
pub async fn discord_connect(app: tauri::AppHandle) -> Result<()> {
    blocking::run(app, |app| super::connect(&app.state::<DiscordState>())).await?
}

#[tauri::command]
#[specta::specta]
pub async fn discord_disconnect(app: tauri::AppHandle) -> Result<()> {
    blocking::run(app, |app| super::disconnect(&app.state::<DiscordState>())).await?
}

#[tauri::command]
#[specta::specta]
pub async fn discord_set_activity(app: tauri::AppHandle, params: SetActivityParams) -> Result<()> {
    blocking::run(app, |app| {
        super::set_activity(&app.state::<DiscordState>(), params)
    })
    .await?
}
