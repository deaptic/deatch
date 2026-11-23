pub mod commands;
pub mod dto;

use super::Authed;
use crate::platform::error::Result;
use crate::twitch::client::ids::UserId;
use crate::twitch::client::pagination::collect;
use crate::twitch::client::params::BroadcasterParams;
use crate::twitch::users::dto::UserRef;
use dto::ChattersPage;
use serde::Deserialize;
use twitch_api::helix::chat::GetChattersRequest;

const CHATTERS_PAGE: usize = 1000;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetChattersParams {
    pub broadcaster_id: UserId,
    #[serde(default)]
    pub cursor: Option<String>,
}

pub async fn get_chatters(twitch: &Authed<'_>, params: GetChattersParams) -> Result<ChattersPage> {
    let mut request =
        GetChattersRequest::new(params.broadcaster_id.as_str(), &twitch.token.user_id)
            .first(CHATTERS_PAGE);
    request.after = params
        .cursor
        .map(|c| twitch_api::helix::Cursor::from(c).into());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(ChattersPage {
        chatters: response.data.into_iter().map(UserRef::from).collect(),
        total: response.pagination_data.total.unwrap_or_default().max(0) as u32,
        cursor: response.pagination_data.cursor.map(|c| c.to_string()),
    })
}

pub async fn get_moderators(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Vec<UserRef>> {
    collect(
        twitch
            .helix
            .get_moderators_in_channel_from_id(params.broadcaster_id.as_str(), &twitch.token),
    )
    .await
}

pub async fn get_vips(twitch: &Authed<'_>, params: BroadcasterParams) -> Result<Vec<UserRef>> {
    collect(
        twitch
            .helix
            .get_vips_in_channel(params.broadcaster_id.as_str(), &twitch.token),
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::GetChattersParams;
    use serde_json::json;

    #[test]
    fn the_first_page_needs_no_cursor() {
        let first: GetChattersParams =
            serde_json::from_value(json!({ "broadcasterId": "1" })).unwrap();
        assert!(first.cursor.is_none());
        let next: GetChattersParams =
            serde_json::from_value(json!({ "broadcasterId": "1", "cursor": "abc" })).unwrap();
        assert_eq!(next.cursor.as_deref(), Some("abc"));
    }
}
