pub mod commands;
pub mod dto;
pub mod events;

use super::Authed;
use crate::error::Result;
use crate::twitch::ids::{MessageId, UnbanRequestId, UserId};
use crate::twitch::params::{BroadcasterParams, BroadcasterUserParams};
use crate::twitch::users::dto::UserRef;
use dto::{BannedPage, BannedUser, BlockedTerm, UnbanRequest};
use serde::Deserialize;
use twitch_api::helix::moderation::{
    add_blocked_term::{AddBlockedTermBody, AddBlockedTermRequest},
    get_blocked_terms::GetBlockedTermsRequest,
    manage_held_automod_messages::{
        ManageHeldAutoModMessagesBody, ManageHeldAutoModMessagesRequest,
    },
    update_shield_mode_status::{UpdateShieldModeStatusBody, UpdateShieldModeStatusRequest},
    AddedSuspiciousUserStatus, GetBannedUsersRequest, GetShieldModeStatusRequest,
    GetUnbanRequestsRequest, RemoveBlockedTermRequest, ResolveUnbanRequest, UnbanRequestStatus,
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

pub async fn ban_user(twitch: &Authed<'_>, params: BanUserParams) -> Result<()> {
    twitch
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
    Ok(())
}

pub async fn unban_user(twitch: &Authed<'_>, params: BroadcasterUserParams) -> Result<()> {
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

pub async fn get_ban(
    twitch: &Authed<'_>,
    params: BroadcasterUserParams,
) -> Result<Option<BannedUser>> {
    let mut request = GetBannedUsersRequest::broadcaster_id(params.broadcaster_id.as_str());
    request.user_id = vec![types::UserId::from(params.user_id)].into();
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().next().map(BannedUser::from))
}

const BANNED_PAGE: usize = 100;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetBannedUsersParams {
    pub broadcaster_id: UserId,
    #[serde(default)]
    pub cursor: Option<String>,
}

pub async fn get_banned_users(
    twitch: &Authed<'_>,
    params: GetBannedUsersParams,
) -> Result<BannedPage> {
    let mut request = GetBannedUsersRequest::broadcaster_id(params.broadcaster_id.as_str());
    request.first = Some(BANNED_PAGE);
    request.after = params
        .cursor
        .map(|c| twitch_api::helix::Cursor::from(c).into());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(BannedPage {
        banned: response.data.into_iter().map(BannedUser::from).collect(),
        cursor: response.pagination_data.cursor.map(|c| c.to_string()),
    })
}

const UNBAN_REQUESTS_PAGE: usize = 100;

pub async fn get_unban_requests(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Vec<UnbanRequest>> {
    let mut request = GetUnbanRequestsRequest::new(
        params.broadcaster_id.as_str(),
        &twitch.token.user_id,
        UnbanRequestStatus::Pending,
    );
    request.first = Some(UNBAN_REQUESTS_PAGE);
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(UnbanRequest::from).collect())
}

#[derive(Clone, Copy, Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum UnbanDecision {
    Approve,
    Deny,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ResolveUnbanRequestParams {
    pub broadcaster_id: UserId,
    pub request_id: UnbanRequestId,
    pub decision: UnbanDecision,
    #[serde(default)]
    pub note: Option<String>,
}

pub async fn resolve_unban_request(
    twitch: &Authed<'_>,
    params: ResolveUnbanRequestParams,
) -> Result<()> {
    let broadcaster_id = params.broadcaster_id.as_str();
    let moderator_id = &twitch.token.user_id;
    let request_id = params.request_id.as_str();
    let mut request = match params.decision {
        UnbanDecision::Approve => {
            ResolveUnbanRequest::approve(broadcaster_id, moderator_id, request_id)
        }
        UnbanDecision::Deny => ResolveUnbanRequest::deny(broadcaster_id, moderator_id, request_id),
    };
    if let Some(note) = params
        .note
        .as_deref()
        .map(str::trim)
        .filter(|n| !n.is_empty())
    {
        request = request.resolution_text(note.to_string());
    }
    twitch
        .helix
        .req_patch(request, twitch_api::helix::EmptyBody, &twitch.token)
        .await?;
    Ok(())
}

#[derive(Clone, Copy, Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum SuspiciousStatus {
    None,
    ActiveMonitoring,
    Restricted,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetSuspiciousStatusParams {
    pub broadcaster_id: UserId,
    pub user_id: UserId,
    pub status: SuspiciousStatus,
}

pub async fn set_suspicious_status(
    twitch: &Authed<'_>,
    params: SetSuspiciousStatusParams,
) -> Result<()> {
    let user_id = params.user_id.as_str();
    let broadcaster_id = params.broadcaster_id.as_str();
    let moderator_id = &twitch.token.user_id;
    let added = match params.status {
        SuspiciousStatus::None => None,
        SuspiciousStatus::ActiveMonitoring => Some(AddedSuspiciousUserStatus::ActiveMonitoring),
        SuspiciousStatus::Restricted => Some(AddedSuspiciousUserStatus::Restricted),
    };
    match added {
        Some(status) => {
            twitch
                .helix
                .add_suspicious_status_to_chat_user(
                    user_id,
                    status,
                    broadcaster_id,
                    moderator_id,
                    &twitch.token,
                )
                .await?;
        }
        None => {
            twitch
                .helix
                .remove_suspicious_status_from_chat_user(
                    user_id,
                    broadcaster_id,
                    moderator_id,
                    &twitch.token,
                )
                .await?;
        }
    }
    Ok(())
}

const BLOCKED_TERMS_PAGE: u32 = 100;

pub async fn get_blocked_terms(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Vec<BlockedTerm>> {
    let mut terms = Vec::new();
    let mut cursor: Option<twitch_api::helix::Cursor> = None;
    loop {
        let mut request =
            GetBlockedTermsRequest::new(params.broadcaster_id.as_str(), &twitch.token.user_id)
                .first(BLOCKED_TERMS_PAGE);
        request.after = cursor.take().map(Into::into);
        let response = twitch.helix.req_get(request, &twitch.token).await?;
        terms.extend(response.data.into_iter().map(BlockedTerm::from));
        match response.pagination_data.cursor {
            Some(next) => cursor = Some(next),
            None => return Ok(terms),
        }
    }
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AddBlockedTermParams {
    pub broadcaster_id: UserId,
    pub text: String,
}

pub async fn add_blocked_term(
    twitch: &Authed<'_>,
    params: AddBlockedTermParams,
) -> Result<Option<BlockedTerm>> {
    let request = AddBlockedTermRequest::new(params.broadcaster_id.as_str(), &twitch.token.user_id);
    let body = AddBlockedTermBody::new(params.text.trim().to_string());
    let response = twitch.helix.req_post(request, body, &twitch.token).await?;
    Ok(response.data.into_iter().next().map(BlockedTerm::from))
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RemoveBlockedTermParams {
    pub broadcaster_id: UserId,
    pub term_id: String,
}

pub async fn remove_blocked_term(
    twitch: &Authed<'_>,
    params: RemoveBlockedTermParams,
) -> Result<()> {
    let request = RemoveBlockedTermRequest::new(
        params.broadcaster_id.as_str(),
        &twitch.token.user_id,
        params.term_id.as_str(),
    );
    twitch.helix.req_delete(request, &twitch.token).await?;
    Ok(())
}

pub async fn get_moderated_channels(twitch: &Authed<'_>) -> Result<Vec<UserRef>> {
    crate::twitch::pagination::collect(
        twitch
            .helix
            .get_moderated_channels(&twitch.token.user_id, &twitch.token),
    )
    .await
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
    pub message_id: MessageId,
    pub action: AutomodAction,
}

pub async fn manage_held_automod_message(
    twitch: &Authed<'_>,
    params: ManageHeldAutomodMessageParams,
) -> Result<()> {
    let body = ManageHeldAutoModMessagesBody::new(
        twitch.token.user_id.as_str(),
        params.message_id.as_str(),
        matches!(params.action, AutomodAction::Allow),
    );
    twitch
        .helix
        .req_post(ManageHeldAutoModMessagesRequest::new(), body, &twitch.token)
        .await?;
    Ok(())
}

pub async fn get_shield_mode(twitch: &Authed<'_>, params: BroadcasterParams) -> Result<bool> {
    let request =
        GetShieldModeStatusRequest::new(params.broadcaster_id.as_str(), &twitch.token.user_id);
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.is_active)
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateShieldModeParams {
    pub broadcaster_id: UserId,
    pub active: bool,
}

pub async fn update_shield_mode(
    twitch: &Authed<'_>,
    params: UpdateShieldModeParams,
) -> Result<bool> {
    let request =
        UpdateShieldModeStatusRequest::new(params.broadcaster_id.as_str(), &twitch.token.user_id);
    let body = UpdateShieldModeStatusBody::is_active(params.active);
    let response = twitch.helix.req_put(request, body, &twitch.token).await?;
    Ok(response.data.is_active)
}

#[cfg(test)]
mod tests {
    use super::{
        AutomodAction, ManageHeldAutomodMessageParams, ResolveUnbanRequestParams,
        SetSuspiciousStatusParams, SuspiciousStatus, UnbanDecision, UpdateShieldModeParams,
    };
    use serde_json::json;

    #[test]
    fn update_shield_mode_params_are_camel_case() {
        let params: UpdateShieldModeParams =
            serde_json::from_value(json!({ "broadcasterId": "1", "active": true })).unwrap();
        assert_eq!(params.broadcaster_id.as_str(), "1");
        assert!(params.active);
    }

    #[test]
    fn suspicious_status_uses_twitch_names() {
        let params: SetSuspiciousStatusParams = serde_json::from_value(json!({
            "broadcasterId": "1",
            "userId": "2",
            "status": "active_monitoring",
        }))
        .unwrap();
        assert!(matches!(params.status, SuspiciousStatus::ActiveMonitoring));
        assert!(serde_json::from_value::<SetSuspiciousStatusParams>(json!({
            "broadcasterId": "1",
            "userId": "2",
            "status": "monitor",
        }))
        .is_err());
    }

    #[test]
    fn unban_decision_takes_an_optional_note() {
        let params: ResolveUnbanRequestParams = serde_json::from_value(json!({
            "broadcasterId": "1",
            "requestId": "r1",
            "decision": "approve",
        }))
        .unwrap();
        assert!(matches!(params.decision, UnbanDecision::Approve));
        assert!(params.note.is_none());
        assert!(serde_json::from_value::<ResolveUnbanRequestParams>(json!({
            "broadcasterId": "1",
            "requestId": "r1",
            "decision": "allow",
        }))
        .is_err());
    }

    #[test]
    fn automod_action_is_allow_or_deny() {
        let params: ManageHeldAutomodMessageParams =
            serde_json::from_value(json!({ "messageId": "m1", "action": "deny" })).unwrap();
        assert!(matches!(params.action, AutomodAction::Deny));
        assert!(serde_json::from_value::<ManageHeldAutomodMessageParams>(
            json!({ "msgId": "m1", "action": "approve" })
        )
        .is_err());
    }
}
