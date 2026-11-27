use serde::Serialize;
use twitch_api::helix::clips::create_clip::CreatedClip as HelixCreatedClip;
use twitch_api::helix::clips::get_clips::Clip as HelixClip;

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Clip {
    pub id: String,
    pub broadcaster_id: String,
    pub title: String,
    pub url: String,
    pub thumbnail_url: String,
    pub views: u32,
    pub created_at: String,
}

impl From<HelixClip> for Clip {
    fn from(c: HelixClip) -> Self {
        Self {
            id: c.id.to_string(),
            broadcaster_id: c.broadcaster_id.to_string(),
            title: c.title,
            url: c.url,
            thumbnail_url: c.thumbnail_url,
            views: u32::try_from(c.view_count).unwrap_or(0),
            created_at: c.created_at.to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CreatedClip {
    pub id: String,
}

impl From<HelixCreatedClip> for CreatedClip {
    fn from(c: HelixCreatedClip) -> Self {
        Self {
            id: c.id.to_string(),
        }
    }
}
