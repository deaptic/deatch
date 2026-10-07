use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum ConnectionState {
    Connecting,
    Up,
    Lost,
}

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionStats {
    pub state: ConnectionState,
    pub subscriptions: u32,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EventSubStats {
    pub connections: Vec<ConnectionStats>,
    pub max_connections: u32,
    pub per_connection: u32,
    pub retrying: u32,
    pub waiting: u32,
    pub capped: u32,
}
