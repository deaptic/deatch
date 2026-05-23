use tauri::Manager;

pub fn read(app: &tauri::AppHandle) -> Result<String, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    let path = dir.join("keymap.json");
    if !path.exists() {
        return Ok(String::new());
    }
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

pub fn write(app: &tauri::AppHandle, contents: String) -> Result<(), String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("keymap.json");
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}
