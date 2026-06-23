use tauri::WebviewWindow;

#[tauri::command]
pub fn set_mentions_badge(
    window: WebviewWindow,
    count: u32,
    icon_bytes: Option<Vec<u8>>,
) -> Result<(), String> {
    crate::services::notifications::set_mentions_badge(&window, count, icon_bytes)
}
