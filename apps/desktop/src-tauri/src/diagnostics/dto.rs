use crate::twitch::eventsub::dto::EventSubStats;
use serde::Serialize;

#[derive(Debug, Default, PartialEq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ProcessStats {
    pub memory_bytes: u64,
    pub cpu_percent: f32,
    pub processes: u32,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AppStats {
    pub app: ProcessStats,
    pub webview: ProcessStats,
    pub eventsub: EventSubStats,
}
