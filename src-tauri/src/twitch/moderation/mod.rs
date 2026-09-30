pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use crate::twitch::ids::{MessageId, UserId};
use crate::twitch::pagination::PaginatedResponse;
use crate::twitch::users::dto::UserRef;
use dto::{Ban, BannedUser};
use serde::Deserialize;
use twitch_api::helix::moderation::{
    manage_held_automod_messages::{
        ManageHeldAutoModMessagesBody, ManageHeldAutoModMessagesRequest,
    },
    GetBannedUsersRequest, GetModeratedChannelsRequest, GetModeratorsRequest,
};
use twitch_api::types;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DeleteChatMessagesParams {
    pub broadcaster_id: UserId,
    #[serde(default)]
    pub message_id: Option<MessageId>,
}

pub async fn delete_chat_messages(
    twitch: &Authed<'_>,
    params: DeleteChatMessagesParams,
) -> Result<()> {
    let broadcaster_id = params.broadcaster_id.as_str();
    let moderator_id = &twitch.token.user_id;
    match &params.message_id {
        Some(message_id) => {
            twitch
                .helix
                .delete_chat_message(
                    broadcaster_id,
                    moderator_id,
                    message_id.as_str(),
                    &twitch.token,
                )
                .await?
        }
        None => {
            twitch
                .helix
                .delete_all_chat_message(broadcaster_id, moderator_id, &twitch.token)
                .await?
        }
    };
    Ok(())
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BanUserParams {
    pub broadcaster_id: UserId,
    pub user_id: UserId,
    #[serde(default)]
    pub duration: Option<u32>,
    #[serde(default)]
    pub reason: Option<String>,
}

pub async fn ban_user(twitch: &Authed<'_>, params: BanUserParams) -> Result<Ban> {
    let ban = twitch
        .helix
        .ban_user(
            params.user_id.as_str(),
            params.reason.as_deref().unwrap_or_default(),
            params.duration,
            params.broadcaster_id.as_str(),
            &twitch.token.user_id,
            &twitch.token,
        )
        .await?;
    Ok(Ban::from(ban))
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct UnbanUserParams {
    pub broadcaster_id: UserId,
    pub user_id: UserId,
}

pub async fn unban_user(twitch: &Authed<'_>, params: UnbanUserParams) -> Result<()> {
    twitch
        .helix
        .unban_user(
            params.user_id.as_str(),
            params.broadcaster_id.as_str(),
            &twitch.token.user_id,
            &twitch.token,
        )
        .await?;
    Ok(())
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetBannedUsersParams {
    pub broadcaster_id: UserId,
    #[serde(default)]
    pub user_id: Option<UserId>,
    #[serde(default)]
    pub first: Option<usize>,
    #[serde(default)]
    pub after: Option<String>,
}

pub async fn get_banned_users(
    twitch: &Authed<'_>,
    params: GetBannedUsersParams,
) -> Result<PaginatedResponse<BannedUser>> {
    let mut request = GetBannedUsersRequest::broadcaster_id(params.broadcaster_id.as_str());
    if let Some(uid) = params.user_id {
        request.user_id = vec![types::UserId::from(uid.0)].into();
    }
    request.first = params.first;
    request.after = crate::twitch::pagination::cursor(params.after);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(crate::twitch::pagination::into_paginated(
        response,
        BannedUser::from,
    ))
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetModeratorsParams {
    pub broadcaster_id: UserId,
    #[serde(default)]
    pub first: Option<usize>,
    #[serde(default)]
    pub after: Option<String>,
}

pub async fn get_moderators(
    twitch: &Authed<'_>,
    params: GetModeratorsParams,
) -> Result<PaginatedResponse<UserRef>> {
    let mut request = GetModeratorsRequest::broadcaster_id(params.broadcaster_id.as_str());
    request.first = params.first;
    request.after = crate::twitch::pagination::cursor(params.after);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(crate::twitch::pagination::into_paginated(
        response,
        UserRef::from,
    ))
}

pub async fn get_moderated_channels(twitch: &Authed<'_>) -> Result<Vec<UserRef>> {
    let mut all: Vec<UserRef> = Vec::new();
    let mut after: Option<String> = None;
    loop {
        let mut request = GetModeratedChannelsRequest::user_id(twitch.token.user_id.clone());
        request.after = crate::twitch::pagination::cursor(after.take());
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

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WarnUserParams {
    pub broadcaster_id: UserId,
    pub user_id: UserId,
    pub reason: String,
}

pub async fn warn_user(twitch: &Authed<'_>, params: WarnUserParams) -> Result<()> {
    twitch
        .helix
        .warn_chat_user(
            params.user_id.as_str(),
            params.reason.as_str(),
            params.broadcaster_id.as_str(),
            &twitch.token.user_id,
            &twitch.token,
        )
        .await?;
    Ok(())
}

#[derive(Clone, Copy, Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum AutomodAction {
    Allow,
    Deny,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ManageHeldAutomodMessageParams {
    pub msg_id: MessageId,
    pub action: AutomodAction,
}

pub async fn manage_held_automod_message(
    twitch: &Authed<'_>,
    params: ManageHeldAutomodMessageParams,
) -> Result<()> {
    let body = ManageHeldAutoModMessagesBody::new(
        twitch.token.user_id.as_str(),
        params.msg_id.as_str(),
        matches!(params.action, AutomodAction::Allow),
    );
    twitch
        .helix
        .req_post(ManageHeldAutoModMessagesRequest::new(), body, &twitch.token)
        .await?;
    Ok(())
}
