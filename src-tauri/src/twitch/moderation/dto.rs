use crate::twitch::users::dto::UserRef;
use serde::Serialize;
use twitch_api::helix::moderation::{
    BannedUser as HelixBannedUser, ModeratedChannel as HelixModeratedChannel,
};

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
