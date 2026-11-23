use super::dto::RecentHistory;
use super::GetRecentMessagesParams;
use crate::platform::error::Result;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_recent_messages(
    http: State<'_, reqwest::Client>,
    params: GetRecentMessagesParams,
) -> Result<RecentHistory> {
    super::fetch_recent_messages(&http, params).await
}
