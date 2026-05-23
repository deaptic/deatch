use super::ids::UserId;
use super::user::UserRef;
use serde::Serialize;
use twitch_api::helix::channels::{get_followed_channels::FollowedBroadcaster, Follower};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Follow {
    pub user: UserRef,
    pub followed_at: String,
}

impl From<Follower> for Follow {
    fn from(f: Follower) -> Self {
        Self {
            user: UserRef {
                id: UserId(f.user_id.to_string()),
                login: f.user_login.to_string(),
                display_name: f.user_name.to_string(),
            },
            followed_at: f.followed_at.to_string(),
        }
    }
}

impl From<FollowedBroadcaster> for Follow {
    fn from(f: FollowedBroadcaster) -> Self {
        Self {
            user: UserRef {
                id: UserId(f.broadcaster_id.to_string()),
                login: f.broadcaster_login.to_string(),
                display_name: f.broadcaster_name.to_string(),
            },
            followed_at: f.followed_at.to_string(),
        }
    }
}
