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

#[derive(Serialize, Clone, specta::Type, tauri_specta::Event)]
pub struct EmoteSetUpdated {
    pub id: String,
    pub actor: Option<String>,
    pub added: Vec<EmoteEntry>,
    pub removed: Vec<String>,
    pub renamed: Vec<Rename>,
}

#[derive(Serialize, Clone, specta::Type)]
pub struct Rename {
    pub from: String,
    pub to: String,
}
