use super::emote::EmoteEntry;
use serde::Serialize;

#[derive(Serialize)]
pub struct ChannelResult {
    pub emotes: Vec<EmoteEntry>,
    pub emote_set_id: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct Delta {
    pub id: String,
    pub actor: Option<String>,
    pub added: Vec<EmoteEntry>,
    pub removed: Vec<String>,
    pub renamed: Vec<Rename>,
}

#[derive(Serialize, Clone)]
pub struct Rename {
    pub from: String,
    pub to: String,
}
