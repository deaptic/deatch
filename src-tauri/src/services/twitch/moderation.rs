use super::Authed;
use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::moderation::{Ban, BannedUser};
use crate::dto::twitch::user::UserRef;
use crate::error::Result;
use std::borrow::Cow;
use twitch_api::helix::moderation::{
    delete_chat_messages::DeleteChatMessagesRequest,
    manage_held_automod_messages::{
        ManageHeldAutoModMessagesBody, ManageHeldAutoModMessagesRequest,
    },
    warn_chat_user::{WarnChatUserBody, WarnChatUserRequest},
    BanUserBody, BanUserRequest, GetBannedUsersRequest, GetModeratedChannelsRequest,
    GetModeratorsRequest, UnbanUserRequest,
};
use twitch_api::types::{MsgId, UserId};

pub async fn delete_chat_messages(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    message_id: Option<String>,
) -> Result<()> {
    let mut request =
        DeleteChatMessagesRequest::new(broadcaster_id.as_str(), twitch.token.user_id.as_str());
    request.message_id = message_id.map(|s| Cow::Owned(MsgId::from(s)));
    twitch.helix.req_delete(request, &twitch.token).await?;
    Ok(())
}

pub async fn ban_user(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    user_id: String,
    duration: Option<u32>,
    reason: Option<String>,
) -> Result<Ban> {
    let request = BanUserRequest::new(broadcaster_id.as_str(), twitch.token.user_id.as_str());
    let body = BanUserBody::new(user_id.as_str(), reason.unwrap_or_default(), duration);
    let response = twitch.helix.req_post(request, body, &twitch.token).await?;
    Ok(Ban::from(response.data))
}

pub async fn get_banned_users(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    user_id: Option<String>,
    first: Option<usize>,
    after: Option<String>,
) -> Result<PaginatedResponse<BannedUser>> {
    let mut request = GetBannedUsersRequest::broadcaster_id(broadcaster_id.as_str());
    if let Some(uid) = user_id.as_deref() {
        request.user_id = vec![UserId::from(uid)].into();
    }
    request.first = first;
    request.after = super::cursor(after);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(super::into_paginated(response, BannedUser::from))
}

pub async fn unban_user(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    user_id: String,
) -> Result<()> {
    let request = UnbanUserRequest::new(
        broadcaster_id.as_str(),
        twitch.token.user_id.as_str(),
        user_id.as_str(),
    );
    twitch.helix.req_delete(request, &twitch.token).await?;
    Ok(())
}

pub async fn get_moderators(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    first: Option<usize>,
    after: Option<String>,
) -> Result<PaginatedResponse<UserRef>> {
    let mut request = GetModeratorsRequest::broadcaster_id(broadcaster_id.as_str());
    request.first = first;
    request.after = super::cursor(after);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(super::into_paginated(response, UserRef::from))
}

pub async fn get_moderated_channels(
    twitch: &Authed<'_>,
    first: Option<usize>,
    after: Option<String>,
) -> Result<PaginatedResponse<UserRef>> {
    let mut request = GetModeratedChannelsRequest::user_id(twitch.token.user_id.clone());
    request.first = first;
    request.after = super::cursor(after);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(super::into_paginated(response, UserRef::from))
}

pub async fn get_all_moderated_channels(twitch: &Authed<'_>) -> Result<Vec<UserRef>> {
    let mut all: Vec<UserRef> = Vec::new();
    let mut after: Option<String> = None;
    loop {
        let mut request = GetModeratedChannelsRequest::user_id(twitch.token.user_id.clone());
        request.after = super::cursor(after.take());
        let response = twitch.helix.req_get(request, &twitch.token).await?;
        all.extend(response.data.into_iter().map(UserRef::from));
        match response.pagination_data.cursor {
            // Pace under Helix's ~13 req/sec budget so a long paginator
            // can't exhaust it; only paid when another page follows.
            Some(cursor) => {
                after = Some(cursor.as_str().to_string());
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }
            None => return Ok(all),
        }
    }
}

pub async fn warn_user(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    user_id: String,
    reason: String,
) -> Result<()> {
    let request = WarnChatUserRequest::new(broadcaster_id.as_str(), twitch.token.user_id.as_str());
    let body = WarnChatUserBody::new(user_id.as_str(), reason.as_str());
    twitch.helix.req_post(request, body, &twitch.token).await?;
    Ok(())
}

pub async fn manage_held_automod_message(
    twitch: &Authed<'_>,
    msg_id: String,
    allow: bool,
) -> Result<()> {
    let request = ManageHeldAutoModMessagesRequest::new();
    let body =
        ManageHeldAutoModMessagesBody::new(twitch.token.user_id.as_str(), msg_id.as_str(), allow);
    twitch.helix.req_post(request, body, &twitch.token).await?;
    Ok(())
}
