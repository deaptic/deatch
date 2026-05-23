use crate::dto::external::robotty::RecentMessage;
use crate::services;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRecentMessagesParams {
    pub channel_login: String,
    pub limit: Option<usize>,
}

#[tauri::command]
pub async fn get_recent_messages(
    params: GetRecentMessagesParams,
) -> Result<Vec<RecentMessage>, String> {
    services::external::robotty::fetch_recent_messages(
        &params.channel_login,
        params.limit.unwrap_or(50),
    )
    .await
}
