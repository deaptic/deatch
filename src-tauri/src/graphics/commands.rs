use super::SetHardwareAccelerationParams;
use crate::error::Result;
use crate::local_dir::local_dir;

#[tauri::command]
#[specta::specta]
pub fn set_hardware_acceleration(params: SetHardwareAccelerationParams) -> Result<()> {
    super::set_hardware_acceleration(&local_dir()?, params)
}
