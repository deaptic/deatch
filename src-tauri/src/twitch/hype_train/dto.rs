use serde::Serialize;
use twitch_api::helix::hypetrain::HypeTrain as HelixHypeTrain;

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct HypeTrain {
    pub id: String,
    pub level: u32,
    pub progress: u32,
    pub goal: u32,
    pub expires_at: String,
}

fn clamp(value: u64) -> u32 {
    u32::try_from(value).unwrap_or(u32::MAX)
}

impl From<HelixHypeTrain> for HypeTrain {
    fn from(t: HelixHypeTrain) -> Self {
        Self {
            id: t.id.to_string(),
            level: clamp(t.level),
            progress: clamp(t.progress),
            goal: clamp(t.goal),
            expires_at: t.expires_at.to_string(),
        }
    }
}
