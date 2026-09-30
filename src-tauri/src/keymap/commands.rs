use crate::error::Result;
use serde::Deserialize;
use tauri::Manager;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WriteKeymapParams {
    pub contents: String,
}

#[tauri::command]
#[specta::specta]
pub fn read_keymap(app: tauri::AppHandle) -> Result<String> {
    super::read(&app.path().app_config_dir()?)
}

#[tauri::command]
#[specta::specta]
pub fn write_keymap(app: tauri::AppHandle, params: WriteKeymapParams) -> Result<()> {
    super::write(&app.path().app_config_dir()?, params.contents)
}
