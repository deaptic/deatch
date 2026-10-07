pub mod commands;

use crate::error::Result;
use serde::Deserialize;
use tauri::image::Image;
use tauri::WebviewWindow;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetMentionsBadgeParams {
    pub count: u32,
    #[serde(default)]
    pub icon_bytes: Option<Vec<u8>>,
}

pub fn set_mentions_badge(window: &WebviewWindow, params: SetMentionsBadgeParams) -> Result<()> {
    let overlay = match params.icon_bytes {
        Some(bytes) if params.count > 0 => Some(Image::from_bytes(&bytes)?.to_owned()),
        _ => None,
    };
    Ok(window.set_overlay_icon(overlay)?)
}
