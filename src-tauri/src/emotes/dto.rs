use serde::Serialize;

#[derive(Serialize, Clone, specta::Type)]
pub struct EmoteEntry {
    pub name: String,
    pub url: String,
}

#[derive(Serialize, specta::Type)]
pub struct ChannelResult {
    pub emotes: Vec<EmoteEntry>,
    pub emote_set_id: Option<String>,
}
