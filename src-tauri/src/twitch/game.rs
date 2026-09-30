use crate::twitch::ids::GameId;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GameRef {
    pub id: GameId,
    pub name: String,
}
