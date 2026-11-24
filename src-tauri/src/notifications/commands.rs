use super::SetTaskbarBadgeParams;
use crate::platform::error::Result;
use tauri::WebviewWindow;

#[tauri::command]
#[specta::specta]
pub fn set_taskbar_badge(window: WebviewWindow, params: SetTaskbarBadgeParams) -> Result<()> {
    super::set_taskbar_badge(&window, params)
}

#[tauri::command]
#[specta::specta]
pub fn flash_taskbar(window: WebviewWindow) -> Result<()> {
    super::flash_taskbar(&window)
}
