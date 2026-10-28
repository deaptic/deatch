use super::{DiscordState, SetActivityParams};
use crate::blocking;
use crate::error::Result;
use tauri::Manager;

// Discord's pipe IO is blocking and can stall while Discord updates.

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
