//! Fetches chat backlog from recent-messages.robotty.de (community IRC mirror)
//! and maps each PRIVMSG to the shape of our EventSub `channel.chat.message`
//! events so the renderer can consume both without a separate code path.

pub mod commands;
pub mod dto;
mod irc;
mod notice;

use crate::error::Result;
use crate::http::{get_json, url};
use dto::RecentHistory;
use reqwest::Url;
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
    let url = recent_messages_url(&broadcaster_login, limit, after)?;
    let resp: RobottyResponse = get_json(http, url).await?;
    Ok(irc::parse_messages(&resp.messages))
}

fn recent_messages_url(login: &str, limit: usize, after: Option<u64>) -> Result<Url> {
    let mut url = url(
        "https://recent-messages.robotty.de/api/v2/recent-messages",
        &[login],
    )?;
    url.query_pairs_mut()
        .append_pair("limit", &limit.to_string());
    if let Some(after) = after {
        url.query_pairs_mut()
            .append_pair("after", &after.to_string());
    }
    Ok(url)
}

#[cfg(test)]
mod tests {
    use super::recent_messages_url;

    #[test]
    fn encodes_the_login_and_appends_after_only_when_given() {
        assert_eq!(
            recent_messages_url("a?b", 50, None).unwrap().as_str(),
            "https://recent-messages.robotty.de/api/v2/recent-messages/a%3Fb?limit=50"
        );
        assert_eq!(
            recent_messages_url("x", 50, Some(7)).unwrap().as_str(),
            "https://recent-messages.robotty.de/api/v2/recent-messages/x?limit=50&after=7"
        );
    }
}
