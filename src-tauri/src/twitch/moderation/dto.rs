use crate::twitch::ids::UserId;
use crate::twitch::users::dto::UserRef;
use serde::Serialize;
use twitch_api::helix::moderation::{
    BanUser, BannedUser as HelixBannedUser, ModeratedChannel as HelixModeratedChannel,
};

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Ban {
    pub user_id: UserId,
    pub broadcaster_id: UserId,
    pub moderator_id: UserId,
    pub created_at: String,
    pub end_time: String,
}

impl From<BanUser> for Ban {
    fn from(b: BanUser) -> Self {
        Self {
            user_id: UserId(b.user_id.to_string()),
            broadcaster_id: UserId(b.broadcaster_id.to_string()),
            moderator_id: UserId(b.moderator_id.to_string()),
            created_at: b.created_at.to_string(),
            end_time: b.end_time.map(|t| t.to_string()).unwrap_or_default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BannedUser {
    pub user: UserRef,
    pub moderator: UserRef,
    pub reason: String,
    pub expires_at: String,
}

impl From<HelixBannedUser> for BannedUser {
    fn from(b: HelixBannedUser) -> Self {
        Self {
            user: UserRef::new(b.user_id, b.user_login, b.user_name),
            moderator: UserRef::new(b.moderator_id, b.moderator_login, b.moderator_name),
            reason: b.reason.unwrap_or_default(),
            expires_at: b.expires_at.map(|t| t.to_string()).unwrap_or_default(),
        }
    }
}

impl From<HelixModeratedChannel> for UserRef {
    fn from(m: HelixModeratedChannel) -> Self {
        UserRef::new(m.broadcaster_id, m.broadcaster_login, m.broadcaster_name)
    }
}
