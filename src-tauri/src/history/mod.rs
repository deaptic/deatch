//! Fetches chat backlog from recent-messages.robotty.de (community IRC mirror)
//! and maps each PRIVMSG to the shape of our EventSub `channel.chat.message`
//! events so the renderer can consume both without a separate code path.

pub mod commands;
pub mod dto;
mod irc;
mod notice;

use crate::error::Result;
use crate::http::get_json;
use dto::RecentHistory;
use serde::Deserialize;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetRecentMessagesParams {
    pub broadcaster_login: String,
    pub limit: usize,
    #[serde(default)]
    pub after: Option<u64>,
}

#[derive(Deserialize)]
struct RobottyResponse {
    messages: Vec<String>,
}

pub async fn fetch_recent_messages(
    http: &reqwest::Client,
    params: GetRecentMessagesParams,
) -> Result<RecentHistory> {
    let GetRecentMessagesParams {
        broadcaster_login,
        limit,
        after,
    } = params;
    let mut url = format!(
        "https://recent-messages.robotty.de/api/v2/recent-messages/{broadcaster_login}?limit={limit}"
    );
    if let Some(after) = after {
        url.push_str(&format!("&after={after}"));
    }
    let resp: RobottyResponse = get_json(http, &url).await?;
    Ok(irc::parse_messages(&resp.messages))
}
