use tauri::State;

use super::{PublishParams, RetainParams, Widgets};
use crate::platform::error::Result;

#[tauri::command]
#[specta::specta]
pub fn widgets_publish(widgets: State<'_, Widgets>, params: PublishParams) -> Result<()> {
    widgets.publish(params);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn widgets_retain(widgets: State<'_, Widgets>, params: RetainParams) -> Result<()> {
    widgets.retain(params);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn widgets_address(widgets: State<'_, Widgets>) -> Result<String> {
    widgets.address()
}
