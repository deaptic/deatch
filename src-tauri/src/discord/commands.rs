use super::{ActivityInput, DiscordState};
use crate::error::Result;
use tauri::Manager;

/// Discord's pipe IO is blocking and can stall while Discord updates, so it
/// must not run on an async worker.
async fn blocking<T: Send + 'static>(
    app: tauri::AppHandle,
    f: impl FnOnce(&DiscordState) -> Result<T> + Send + 'static,
) -> Result<T> {
    tauri::async_runtime::spawn_blocking(move || f(&app.state::<DiscordState>())).await?
}

#[tauri::command]
#[specta::specta]
pub async fn discord_connect(app: tauri::AppHandle) -> Result<()> {
    blocking(app, super::connect).await
}

#[tauri::command]
#[specta::specta]
pub async fn discord_disconnect(app: tauri::AppHandle) -> Result<()> {
    blocking(app, super::disconnect).await
}

#[tauri::command]
#[specta::specta]
pub async fn discord_set_activity(app: tauri::AppHandle, params: ActivityInput) -> Result<()> {
    blocking(app, move |state| super::set_activity(state, params)).await
}
