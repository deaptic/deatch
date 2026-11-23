pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use crate::twitch::ids::UserId;
use crate::twitch::users::dto::UserRef;
use serde::Deserialize;
use twitch_api::helix::users::GetUserBlockListRequest;

const BLOCK_LIST_PAGE: usize = 100;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BlockParams {
    pub user_id: UserId,
}

pub async fn get_blocked_users(twitch: &Authed<'_>) -> Result<Vec<UserRef>> {
    let mut users = Vec::new();
    let mut cursor: Option<twitch_api::helix::Cursor> = None;
    loop {
        let mut request = GetUserBlockListRequest::broadcaster_id(&twitch.token.user_id);
        request.first = Some(BLOCK_LIST_PAGE);
        request.after = cursor.take().map(Into::into);
        let response = twitch.helix.req_get(request, &twitch.token).await?;
        users.extend(response.data.into_iter().map(UserRef::from));
        match response.pagination_data.cursor {
            Some(next) => cursor = Some(next),
            None => return Ok(users),
        }
    }
}

pub async fn block_user(twitch: &Authed<'_>, params: BlockParams) -> Result<()> {
    twitch
        .helix
        .block_user(params.user_id.as_str(), &twitch.token)
        .await?;
    Ok(())
}

pub async fn unblock_user(twitch: &Authed<'_>, params: BlockParams) -> Result<()> {
    twitch
        .helix
        .unblock_user(params.user_id.as_str(), &twitch.token)
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::BlockParams;
    use serde_json::json;

    #[test]
    fn block_params_name_the_user() {
        let params: BlockParams = serde_json::from_value(json!({ "userId": "2" })).unwrap();
        assert_eq!(params.user_id.as_str(), "2");
    }
}
