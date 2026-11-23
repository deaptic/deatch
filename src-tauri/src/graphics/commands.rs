use super::SetHardwareAccelerationParams;
use crate::platform::error::Result;
use crate::platform::local_dir::local_dir;

#[tauri::command]
#[specta::specta]
pub fn set_hardware_acceleration(params: SetHardwareAccelerationParams) -> Result<()> {
    super::set_hardware_acceleration(&local_dir()?, params)
}
