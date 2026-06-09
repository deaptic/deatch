use super::ids::UserId;
use super::user::UserRef;
use serde::Serialize;
use twitch_api::helix::search::search_channels::Channel as HelixSearchChannel;
use twitch_api::types::TwitchCategory;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchChannel {
    pub user: UserRef,
    pub game_name: String,
    pub title: String,
    pub is_live: bool,
    pub profile_image_url: String,
    pub started_at: String,
}

impl From<HelixSearchChannel> for SearchChannel {
    fn from(c: HelixSearchChannel) -> Self {
        Self {
            user: UserRef {
                id: UserId(c.id.to_string()),
                login: c.broadcaster_login.to_string(),
                display_name: c.display_name.to_string(),
            },
            game_name: c.game_name,
            title: c.title,
            is_live: c.is_live,
            profile_image_url: c
                .thumbnail_url
                .replace("{width}", "300")
                .replace("{height}", "300"),
            started_at: c.started_at.map(|t| t.to_string()).unwrap_or_default(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub name: String,
    pub box_art_url: String,
}

impl From<TwitchCategory> for Category {
    fn from(c: TwitchCategory) -> Self {
        Self {
            id: c.id.to_string(),
            name: c.name,
            box_art_url: c
                .box_art_url
                .replace("{width}", "285")
                .replace("{height}", "380")
                .replace("-52x72.", "-285x380."),
        }
    }
}
