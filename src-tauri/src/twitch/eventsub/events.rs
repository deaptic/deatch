use crate::error::Error;
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
    /// Twitch refused the subscription; `message` is its own explanation.
    Rejected {
        message: String,
    },
    /// A request failed; it is retried.
    Failed {
        error: Error,
    },
    /// Every connection Twitch allows is full.
    Capped {
        connections: usize,
        #[serde(rename = "perConnection")]
        per_connection: usize,
    },
}

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
#[serde(rename_all = "camelCase")]
pub struct ChatStatus {
    pub broadcaster_id: UserId,
    pub state: ChatState,
}
