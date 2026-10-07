use crate::twitch::game::GameRef;
use crate::twitch::users::dto::UserRef;
use serde::Serialize;
use twitch_api::helix::channels::ChannelInformation;

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
            game: GameRef::new(c.game_id, c.game_name),
            title: c.title,
        }
    }
}
