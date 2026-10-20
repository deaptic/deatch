use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, specta::Type)]
pub struct LinkChannel {
    pub login: String,
    #[serde(default)]
    pub muted: bool,
}

#[derive(Clone, Serialize, Deserialize, specta::Type, tauri_specta::Event)]
pub struct LinkState {
    pub channels: Vec<LinkChannel>,
    pub current: Option<String>,
    /// The extension can process audio (`set_audio`); older ones leave it out.
    #[serde(default)]
    pub audio: bool,
}

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
pub struct LinkDisconnected;
