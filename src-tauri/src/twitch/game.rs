use crate::twitch::ids::GameId;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GameRef {
    pub id: GameId,
    pub name: String,
}

impl GameRef {
    pub fn new(id: impl ToString, name: impl ToString) -> Self {
        Self {
            id: GameId(id.to_string()),
            name: name.to_string(),
        }
    }
}
