use tauri::WebviewWindow;

#[tauri::command]
pub fn set_mentions_badge(
    window: WebviewWindow,
    count: u32,
    icon_bytes: Option<Vec<u8>>,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let overlay = match icon_bytes {
            Some(bytes) if count > 0 => Some(
                tauri::image::Image::from_bytes(&bytes)
                    .map_err(|e| e.to_string())?
                    .to_owned(),
            ),
            _ => None,
        };
        window.set_overlay_icon(overlay).map_err(|e| e.to_string())?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = icon_bytes;
        let badge: Option<i64> = if count > 0 { Some(count as i64) } else { None };
        window
            .set_badge_count(badge, None)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
