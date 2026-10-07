use super::SetMentionsBadgeParams;
use crate::error::Result;
use tauri::WebviewWindow;

#[tauri::command]
#[specta::specta]
pub fn set_mentions_badge(window: WebviewWindow, params: SetMentionsBadgeParams) -> Result<()> {
    super::set_mentions_badge(&window, params)
}
