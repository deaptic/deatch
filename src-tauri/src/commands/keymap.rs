use crate::services;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteKeymapParams {
    pub contents: String,
}

#[tauri::command]
pub fn read_keymap(app: tauri::AppHandle) -> Result<String, String> {
    services::keymap::read(&app)
}

#[tauri::command]
pub fn write_keymap(app: tauri::AppHandle, params: WriteKeymapParams) -> Result<(), String> {
    services::keymap::write(&app, params.contents)
}
