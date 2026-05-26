use serde::Serialize;
use twitch_api::helix::clips::create_clip::CreatedClip as HelixCreatedClip;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatedClip {
    pub id: String,
}

impl From<HelixCreatedClip> for CreatedClip {
    fn from(c: HelixCreatedClip) -> Self {
        Self { id: c.id.to_string() }
    }
}
