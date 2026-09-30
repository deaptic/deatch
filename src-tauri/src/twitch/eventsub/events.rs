use super::EventKind;
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
    pub broadcaster_ids: Vec<UserId>,
}

#[derive(Clone, Serialize, specta::Type)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum SubscriptionStatus {
    Subscribed,
    Unsubscribed,
    Failed { error: String },
}

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
#[serde(rename_all = "camelCase")]
pub struct EventSubSubscription {
    pub broadcaster_id: UserId,
    pub kind: EventKind,
    pub status: SubscriptionStatus,
}

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
pub struct EventSubFailed(pub Error);
