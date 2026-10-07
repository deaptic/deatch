use crate::twitch::ids::UserId;
use serde::Serialize;

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
pub struct EventSubConnection {
    pub connected: bool,
}

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
#[serde(rename_all = "camelCase")]
pub struct EventSubRecovered {
    pub since: u64,
    pub broadcaster_id: UserId,
}

#[derive(Clone, Serialize, specta::Type)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ChatState {
    Connected,
    Disconnected,
    Failed { error: String },
}

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
#[serde(rename_all = "camelCase")]
pub struct ChatStatus {
    pub broadcaster_id: UserId,
    pub state: ChatState,
}
