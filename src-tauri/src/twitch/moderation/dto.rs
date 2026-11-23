use crate::twitch::client::ids::UnbanRequestId;
use crate::twitch::users::dto::UserRef;
use serde::Serialize;
use twitch_api::helix::moderation::{
    BannedUser as HelixBannedUser, BlockedTerm as HelixBlockedTerm,
    ModeratedChannel as HelixModeratedChannel, UnbanRequest as HelixUnbanRequest,
};

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BannedUser {
    pub user: UserRef,
    pub moderator: UserRef,
    pub reason: Option<String>,
    pub expires_at: Option<String>,
}

impl From<HelixBannedUser> for BannedUser {
    fn from(b: HelixBannedUser) -> Self {
        Self {
            user: UserRef::new(b.user_id, b.user_login, b.user_name),
            moderator: UserRef::new(b.moderator_id, b.moderator_login, b.moderator_name),
            reason: b.reason.filter(|r| !r.is_empty()),
            expires_at: b.expires_at.map(|t| t.to_string()),
        }
    }
}

impl From<HelixModeratedChannel> for UserRef {
    fn from(m: HelixModeratedChannel) -> Self {
        UserRef::new(m.broadcaster_id, m.broadcaster_login, m.broadcaster_name)
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct UnbanRequest {
    pub id: UnbanRequestId,
    pub user: UserRef,
    pub text: String,
    pub created_at: String,
}

impl From<HelixUnbanRequest> for UnbanRequest {
    fn from(r: HelixUnbanRequest) -> Self {
        Self {
            id: r.id.take().into(),
            user: UserRef::new(r.user_id, r.user_login, r.user_name),
            text: r.text,
            created_at: r.created_at.to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BlockedTerm {
    pub id: String,
    pub text: String,
}

impl From<HelixBlockedTerm> for BlockedTerm {
    fn from(t: HelixBlockedTerm) -> Self {
        Self {
            id: t.id.take(),
            text: t.text,
        }
    }
}

#[derive(Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BannedPage {
    pub banned: Vec<BannedUser>,
    pub cursor: Option<String>,
}
