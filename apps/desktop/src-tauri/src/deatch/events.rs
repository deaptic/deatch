use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
pub struct DeatchConnection {
    pub connected: bool,
}

#[derive(Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "lowercase")]
pub enum PresenceState {
    Online,
    Offline,
    Unknown,
}

#[derive(Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PresenceEntry {
    pub twitch_id: String,
    pub state: PresenceState,
}

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
pub struct DeatchPresence {
    pub entries: Vec<PresenceEntry>,
}
