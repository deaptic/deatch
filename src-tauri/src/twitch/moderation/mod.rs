pub mod commands;
pub mod dto;
pub mod events;

use super::Authed;
use crate::error::Result;
use crate::twitch::ids::{MessageId, UserId};
use crate::twitch::params::BroadcasterUserParams;
use crate::twitch::users::dto::UserRef;
use dto::{Ban, BannedUser};
use serde::Deserialize;
use twitch_api::helix::moderation::{
    manage_held_automod_messages::{
        ManageHeldAutoModMessagesBody, ManageHeldAutoModMessagesRequest,
    },
    GetBannedUsersRequest,
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

#[cfg(test)]
mod tests {
    use super::{AutomodAction, ManageHeldAutomodMessageParams};
    use serde_json::json;

    #[test]
    fn automod_action_is_allow_or_deny() {
        let params: ManageHeldAutomodMessageParams =
            serde_json::from_value(json!({ "msgId": "m1", "action": "deny" })).unwrap();
        assert!(matches!(params.action, AutomodAction::Deny));
        assert!(serde_json::from_value::<ManageHeldAutomodMessageParams>(
            json!({ "msgId": "m1", "action": "approve" })
        )
        .is_err());
    }
}
