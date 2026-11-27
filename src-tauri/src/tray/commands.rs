use crate::platform::error::Result;
use tauri::WebviewWindow;

#[tauri::command]
#[specta::specta]
pub fn show_window(window: WebviewWindow) -> Result<()> {
    super::show(&window)
}

#[tauri::command]
#[specta::specta]
pub fn hide_window(window: WebviewWindow) -> Result<()> {
    super::hide(&window)
}
