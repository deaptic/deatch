use super::dto::RecentMessage;
use crate::error::Result;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRecentMessagesParams {
    pub channel_login: String,
    pub limit: Option<usize>,
    pub after: Option<u64>,
}

#[tauri::command]
pub async fn get_recent_messages(
    http: State<'_, reqwest::Client>,
    params: GetRecentMessagesParams,
) -> Result<Vec<RecentMessage>> {
    super::fetch_recent_messages(
        &http,
        &params.channel_login,
        params.limit.unwrap_or(50),
        params.after,
    )
    .await
}
