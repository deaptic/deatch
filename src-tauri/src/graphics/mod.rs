pub mod commands;

use std::fs;
use std::io;
use std::path::Path;

use serde::Deserialize;

/// WebView2 reads GPU flags once at process start, so the choice is a marker
/// file checked before the window exists; a toggle applies on next launch.
const DISABLE_GPU_MARKER: &str = "disable-gpu";

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetHardwareAccelerationParams {
    pub enabled: bool,
}

pub fn apply_startup_flags() {
    match crate::local_dir::local_dir() {
        Ok(dir) if !hardware_acceleration_enabled(&dir) => {
            std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--disable-gpu");
        }
        Ok(_) => {}
        Err(e) => log::warn!("hardware acceleration setting unreadable: {e}"),
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
}
