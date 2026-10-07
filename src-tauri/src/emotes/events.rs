use super::dto::EmoteEntry;
use serde::Serialize;

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
