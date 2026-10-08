use crate::error::Result;
use tauri::Manager;

#[tauri::command]
#[specta::specta]
pub fn read_keymap(app: tauri::AppHandle) -> Result<String> {
    super::read(&app.path().app_config_dir()?)
}
