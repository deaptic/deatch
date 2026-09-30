use crate::error::Result;
use crate::services;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteKeymapParams {
    pub contents: String,
}

#[tauri::command]
pub fn read_keymap(app: tauri::AppHandle) -> Result<String> {
    services::keymap::read(&app)
}

#[tauri::command]
pub fn write_keymap(app: tauri::AppHandle, params: WriteKeymapParams) -> Result<()> {
    services::keymap::write(&app, params.contents)
}
