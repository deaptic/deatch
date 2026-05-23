use super::ids::GameId;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameRef {
    pub id: GameId,
    pub name: String,
}
