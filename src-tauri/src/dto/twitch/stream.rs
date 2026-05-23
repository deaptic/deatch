use super::game::GameRef;
use super::ids::{GameId, StreamId, UserId};
use super::user::UserRef;
use serde::Serialize;
use twitch_api::helix::streams as helix_streams;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Thumbnail {
    pub small: String,
    pub medium: String,
    pub large: String,
}

impl Thumbnail {
    pub fn from_template(template: &str) -> Self {
        Self {
            small: render(template, 320, 180),
            medium: render(template, 640, 360),
            large: render(template, 1280, 720),
        }
    }
}

fn render(template: &str, width: u32, height: u32) -> String {
    template
        .replace("{width}", &width.to_string())
        .replace("{height}", &height.to_string())
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Stream {
    pub id: StreamId,
    pub user: UserRef,
    pub game: GameRef,
    pub title: String,
    pub viewer_count: u32,
    pub started_at: String,
    pub language: String,
    pub thumbnail: Thumbnail,
    pub tags: Vec<String>,
    pub is_mature: bool,
}

impl From<helix_streams::Stream> for Stream {
    fn from(s: helix_streams::Stream) -> Self {
        Self {
            id: StreamId(s.id.to_string()),
            user: UserRef {
                id: UserId(s.user_id.to_string()),
                login: s.user_login.to_string(),
                display_name: s.user_name.to_string(),
            },
            game: GameRef {
                id: GameId(s.game_id.to_string()),
                name: s.game_name,
            },
            title: s.title,
            viewer_count: s.viewer_count as u32,
            started_at: s.started_at.to_string(),
            language: s.language,
            thumbnail: Thumbnail::from_template(&s.thumbnail_url),
            tags: s.tags,
            is_mature: s.is_mature,
        }
    }
}
