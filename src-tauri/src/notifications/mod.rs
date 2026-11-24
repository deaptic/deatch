pub mod commands;

use crate::platform::error::Result;
use serde::Deserialize;
use tauri::image::Image;
use tauri::{UserAttentionType, WebviewWindow};

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetTaskbarBadgeParams {
    pub count: u32,
    #[serde(default)]
    pub icon_bytes: Option<Vec<u8>>,
}

pub fn set_taskbar_badge(window: &WebviewWindow, params: SetTaskbarBadgeParams) -> Result<()> {
    let overlay = match params.icon_bytes {
        Some(bytes) if params.count > 0 => Some(Image::from_bytes(&bytes)?.to_owned()),
        _ => None,
    };
    Ok(window.set_overlay_icon(overlay)?)
}

pub fn flash_taskbar(window: &WebviewWindow) -> Result<()> {
    if !window.is_focused()? {
        window.request_user_attention(Some(UserAttentionType::Informational))?;
    }
    Ok(())
}
