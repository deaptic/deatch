use super::ids::UserId;
use super::user::UserRef;
use serde::Serialize;
use twitch_api::helix::moderation::{
    BanUser, BannedUser as HelixBannedUser, ModeratedChannel as HelixModeratedChannel,
    Moderator as HelixModerator,
};

#[derive(Debug, Clone, Serialize)]
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

#[derive(Debug, Clone, Serialize)]
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
            user: UserRef {
                id: UserId(b.user_id.to_string()),
                login: b.user_login.to_string(),
                display_name: b.user_name.to_string(),
            },
            moderator: UserRef {
                id: UserId(b.moderator_id.to_string()),
                login: b.moderator_login.to_string(),
                display_name: b.moderator_name.to_string(),
            },
            reason: b.reason.unwrap_or_default(),
            expires_at: b.expires_at.map(|t| t.to_string()).unwrap_or_default(),
        }
    }
}

impl From<HelixModerator> for UserRef {
    fn from(m: HelixModerator) -> Self {
        Self {
            id: UserId(m.user_id.to_string()),
            login: m.user_login.to_string(),
            display_name: m.user_name.to_string(),
        }
    }
}

impl From<HelixModeratedChannel> for UserRef {
    fn from(m: HelixModeratedChannel) -> Self {
        Self {
            id: UserId(m.broadcaster_id.to_string()),
            login: m.broadcaster_login.to_string(),
            display_name: m.broadcaster_name.to_string(),
        }
    }
}
