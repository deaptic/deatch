pub mod commands;

use crate::platform::error::Result;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, WebviewWindow};

pub const LOGIN_FLAG: &str = "--minimized";
const MARKER: &str = "in-tray";

fn marker(app: &AppHandle) -> Result<PathBuf> {
    Ok(app.path().app_data_dir()?.join(MARKER))
}

pub fn show(window: &WebviewWindow) -> Result<()> {
    window.show()?;
    window.unminimize()?;
    window.set_focus()?;
    match std::fs::remove_file(marker(window.app_handle())?) {
        Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(e.into()),
        _ => Ok(()),
    }
}

pub fn hide(window: &WebviewWindow) -> Result<()> {
    window.hide()?;
    crate::graphics::update_memory_target(&window.as_ref().window());
    let path = marker(window.app_handle())?;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    Ok(std::fs::write(path, [])?)
}

pub fn bring_to_front(app: &AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    if let Err(e) = show(&window) {
        log::warn!("window not brought to front: {e}");
    }
}

pub fn start(app: &AppHandle) {
    let at_login = std::env::args().any(|arg| arg == LOGIN_FLAG);
    let left_in_tray = marker(app).is_ok_and(|path| path.exists());
    if !(at_login && left_in_tray) {
        bring_to_front(app);
    } else if let Some(window) = app.get_webview_window("main") {
        crate::graphics::update_memory_target(&window.as_ref().window());
    }
}
