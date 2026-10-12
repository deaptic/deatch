use crate::twitch::game::GameRef;
use crate::twitch::ids::StreamId;
use crate::twitch::template::render_size;
use crate::twitch::users::dto::UserRef;
use serde::Serialize;
use twitch_api::helix::streams as helix_streams;

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Stream {
    pub id: StreamId,
    pub user: UserRef,
    pub game: GameRef,
    pub title: String,
    pub viewer_count: u32,
    pub started_at: String,
    pub language: String,
    pub thumbnail_url: String,
    pub tags: Vec<String>,
    pub is_mature: bool,
}

impl From<helix_streams::Stream> for Stream {
    fn from(s: helix_streams::Stream) -> Self {
        Self {
            id: StreamId(s.id.to_string()),
            user: UserRef::new(s.user_id, s.user_login, s.user_name),
            game: GameRef::new(s.game_id, s.game_name),
            title: s.title,
            viewer_count: s.viewer_count as u32,
            started_at: s.started_at.to_string(),
            language: s.language,
            thumbnail_url: render_size(&s.thumbnail_url, 640, 360),
            tags: s.tags,
            is_mature: s.is_mature,
        }
    }
}
