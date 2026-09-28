use super::helix;
use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::moderation::{Ban, BannedUser};
use crate::dto::twitch::user::UserRef;
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
use twitch_api::twitch_oauth2::UserToken;
use twitch_api::types::{MsgId, UserId};

pub async fn delete_chat_messages(
    token: &UserToken,
    broadcaster_id: String,
    message_id: Option<String>,
) -> Result<(), String> {
    let mut request =
        DeleteChatMessagesRequest::new(broadcaster_id.as_str(), token.user_id.as_str());
    request.message_id = message_id.map(|s| Cow::Owned(MsgId::from(s)));
    helix()
        .req_delete(request, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub async fn ban_user(
    token: &UserToken,
    broadcaster_id: String,
    user_id: String,
    duration: Option<u32>,
    reason: Option<String>,
) -> Result<Ban, String> {
    let request = BanUserRequest::new(broadcaster_id.as_str(), token.user_id.as_str());
    let body = BanUserBody::new(user_id.as_str(), reason.unwrap_or_default(), duration);
    helix()
        .req_post(request, body, token)
        .await
        .map(|r| Ban::from(r.data))
        .map_err(|e| e.to_string())
}

pub async fn get_banned_users(
    token: &UserToken,
    broadcaster_id: String,
    user_id: Option<String>,
    first: Option<usize>,
    after: Option<String>,
) -> Result<PaginatedResponse<BannedUser>, String> {
    let mut request = GetBannedUsersRequest::broadcaster_id(broadcaster_id.as_str());
    if let Some(uid) = user_id.as_deref() {
        request.user_id = vec![UserId::from(uid)].into();
    }
    request.first = first;
    request.after = super::cursor(after);

    let response = helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(super::into_paginated(response, BannedUser::from))
}

pub async fn unban_user(
    token: &UserToken,
    broadcaster_id: String,
    user_id: String,
) -> Result<(), String> {
    let request = UnbanUserRequest::new(
        broadcaster_id.as_str(),
        token.user_id.as_str(),
        user_id.as_str(),
    );
    helix()
        .req_delete(request, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub async fn get_moderators(
    token: &UserToken,
    broadcaster_id: String,
    first: Option<usize>,
    after: Option<String>,
) -> Result<PaginatedResponse<UserRef>, String> {
    let mut request = GetModeratorsRequest::broadcaster_id(broadcaster_id.as_str());
    request.first = first;
    request.after = super::cursor(after);

    let response = helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(super::into_paginated(response, UserRef::from))
}

pub async fn get_moderated_channels(
    token: &UserToken,
    first: Option<usize>,
    after: Option<String>,
) -> Result<PaginatedResponse<UserRef>, String> {
    let mut request = GetModeratedChannelsRequest::user_id(token.user_id.clone());
    request.first = first;
    request.after = super::cursor(after);

    let response = helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(super::into_paginated(response, UserRef::from))
}

/// Internal helper for the eventsub runner — fetches every moderated channel
/// for the authenticated user so the `is_mod` cache can be refreshed. Not
/// exposed as a Tauri command.
pub async fn get_all_moderated_channels(token: &UserToken) -> Result<Vec<UserRef>, String> {
    let helix = helix();
    let mut all: Vec<UserRef> = Vec::new();
    let mut after: Option<String> = None;
    loop {
        let mut request = GetModeratedChannelsRequest::user_id(token.user_id.clone());
        request.after = super::cursor(after.take());
        let response = helix
            .req_get(request, token)
            .await
            .map_err(|e| e.to_string())?;
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
    token: &UserToken,
    broadcaster_id: String,
    user_id: String,
    reason: String,
) -> Result<(), String> {
    let request = WarnChatUserRequest::new(broadcaster_id.as_str(), token.user_id.as_str());
    let body = WarnChatUserBody::new(user_id.as_str(), reason.as_str());
    helix()
        .req_post(request, body, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub async fn manage_held_automod_message(
    token: &UserToken,
    msg_id: String,
    allow: bool,
) -> Result<(), String> {
    let request = ManageHeldAutoModMessagesRequest::new();
    let body = ManageHeldAutoModMessagesBody::new(token.user_id.as_str(), msg_id.as_str(), allow);
    helix()
        .req_post(request, body, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
