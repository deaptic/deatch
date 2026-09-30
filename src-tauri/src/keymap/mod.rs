pub mod commands;

use crate::error::Result;
use tauri::Manager;

pub fn read(app: &tauri::AppHandle) -> Result<String> {
    let path = app.path().app_config_dir()?.join("keymap.json");
    if !path.exists() {
        return Ok(String::new());
    }
    Ok(std::fs::read_to_string(&path)?)
}

pub fn write(app: &tauri::AppHandle, contents: String) -> Result<()> {
    let dir = app.path().app_config_dir()?;
    std::fs::create_dir_all(&dir)?;
    Ok(std::fs::write(dir.join("keymap.json"), contents)?)
}
