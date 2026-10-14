use super::SetHardwareAccelerationParams;
use crate::error::Result;

#[tauri::command]
#[specta::specta]
pub fn set_hardware_acceleration(params: SetHardwareAccelerationParams) -> Result<()> {
    Ok(super::set_hardware_acceleration(
        &crate::local_dir::local_dir()?,
        params.enabled,
    )?)
}
