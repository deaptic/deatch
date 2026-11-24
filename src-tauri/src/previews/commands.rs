use super::dto::LinkPreview;
use super::LinkPreviewParams;
use crate::platform::error::Result;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn link_preview(
    http: State<'_, reqwest::Client>,
    params: LinkPreviewParams,
) -> Result<Option<LinkPreview>> {
    super::preview(&http, params).await
}
