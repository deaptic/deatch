pub mod commands;

use std::fs;
use std::io;
use std::path::Path;

use serde::Deserialize;
use tauri::Manager;
use webview2_com::Microsoft::Web::WebView2::Win32::{
    ICoreWebView2_19, COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL,
    COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_LOW, COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_NORMAL,
};
use windows_core::Interface;

/// WebView2 reads GPU flags once at process start, so the choice is a marker
/// file checked before the window exists; a toggle applies on next launch.
const DISABLE_GPU_MARKER: &str = "disable-gpu";
const BROWSER_ARGUMENTS: &str = "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS";
const DISABLE_GPU_ARGUMENT: &str = "--disable-gpu";

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetHardwareAccelerationParams {
    pub enabled: bool,
}

pub fn apply_startup_flags() {
    match crate::local_dir::local_dir() {
        Ok(dir) if !hardware_acceleration_enabled(&dir) => {
            let existing = std::env::var(BROWSER_ARGUMENTS).ok();
            std::env::set_var(
                BROWSER_ARGUMENTS,
                with_argument(existing.as_deref(), DISABLE_GPU_ARGUMENT),
            );
        }
        Ok(_) => {}
        Err(e) => log::warn!("hardware acceleration setting unreadable: {e}"),
    }
}

fn with_argument(existing: Option<&str>, argument: &str) -> String {
    match existing.map(str::trim) {
        Some(existing) if !existing.is_empty() => format!("{existing} {argument}"),
        _ => argument.to_string(),
    }
}

pub fn hardware_acceleration_enabled(dir: &Path) -> bool {
    !dir.join(DISABLE_GPU_MARKER).exists()
}

pub fn set_hardware_acceleration(
    dir: &Path,
    params: SetHardwareAccelerationParams,
) -> crate::error::Result<()> {
    let marker = dir.join(DISABLE_GPU_MARKER);
    if params.enabled {
        match fs::remove_file(marker) {
            Err(e) if e.kind() != io::ErrorKind::NotFound => Err(e.into()),
            _ => Ok(()),
        }
    } else {
        Ok(fs::write(marker, "")?)
    }
}

pub fn on_window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    if !matches!(event, tauri::WindowEvent::Resized(_)) {
        return;
    }
    let minimized = match window.is_minimized() {
        Ok(minimized) => minimized,
        Err(e) => {
            log::warn!("window state unreadable: {e}");
            return;
        }
    };
    let level = if minimized {
        COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_LOW
    } else {
        COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_NORMAL
    };
    let Some(webview) = window.get_webview_window(window.label()) else {
        return;
    };
    let applied = webview.with_webview(move |platform| {
        if let Err(e) = set_memory_target(&platform, level) {
            log::warn!("webview memory target not set: {e}");
        }
    });
    if let Err(e) = applied {
        log::warn!("webview memory target not set: {e}");
    }
}

fn set_memory_target(
    platform: &tauri::webview::PlatformWebview,
    level: COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL,
) -> windows_core::Result<()> {
    unsafe {
        let webview: ICoreWebView2_19 = platform.controller().CoreWebView2()?.cast()?;
        webview.SetMemoryUsageTargetLevel(level)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn marker_round_trip() {
        let dir = std::env::temp_dir().join(format!("deatch-graphics-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        assert!(hardware_acceleration_enabled(&dir));
        set_hardware_acceleration(&dir, SetHardwareAccelerationParams { enabled: false }).unwrap();
        assert!(!hardware_acceleration_enabled(&dir));
        set_hardware_acceleration(&dir, SetHardwareAccelerationParams { enabled: true }).unwrap();
        set_hardware_acceleration(&dir, SetHardwareAccelerationParams { enabled: true }).unwrap();
        assert!(hardware_acceleration_enabled(&dir));
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn appends_to_existing_browser_arguments() {
        assert_eq!(with_argument(None, "--b"), "--b");
        assert_eq!(with_argument(Some(" "), "--b"), "--b");
        assert_eq!(with_argument(Some("--a=1 "), "--b"), "--a=1 --b");
    }
}
