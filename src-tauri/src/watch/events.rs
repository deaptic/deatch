use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, specta::Type)]
pub struct WatchChannel {
    pub login: String,
    #[serde(default)]
    pub muted: bool,
}

#[derive(Clone, Serialize, Deserialize, specta::Type, tauri_specta::Event)]
pub struct WatchState {
    pub channels: Vec<WatchChannel>,
    pub current: Option<String>,
}

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
pub struct WatchDisconnected;
