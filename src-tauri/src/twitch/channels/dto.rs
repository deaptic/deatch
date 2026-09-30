use crate::twitch::game::GameRef;
use crate::twitch::ids::GameId;
use crate::twitch::users::dto::UserRef;
use serde::Serialize;
use twitch_api::helix::channels::{
    get_followed_channels::FollowedBroadcaster, ChannelInformation, Follower,
};

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ChannelInfo {
    pub broadcaster: UserRef,
    pub game: GameRef,
    pub title: String,
}

impl From<ChannelInformation> for ChannelInfo {
    fn from(c: ChannelInformation) -> Self {
        Self {
            broadcaster: UserRef::new(c.broadcaster_id, c.broadcaster_login, c.broadcaster_name),
            game: GameRef {
                id: GameId(c.game_id.to_string()),
                name: c.game_name.to_string(),
            },
            title: c.title,
        }
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Follow {
    pub user: UserRef,
    pub followed_at: String,
}

impl From<Follower> for Follow {
    fn from(f: Follower) -> Self {
        Self {
            user: UserRef::new(f.user_id, f.user_login, f.user_name),
            followed_at: f.followed_at.to_string(),
        }
    }
}

impl From<FollowedBroadcaster> for Follow {
    fn from(f: FollowedBroadcaster) -> Self {
        Self {
            user: UserRef::new(f.broadcaster_id, f.broadcaster_login, f.broadcaster_name),
            followed_at: f.followed_at.to_string(),
        }
    }
}
