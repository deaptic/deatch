use crate::twitch::users::dto::UserRef;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Whisper {
    pub id: String,
    pub peer: UserRef,
    pub outgoing: bool,
    pub text: String,
    pub timestamp: u64,
    pub unread: bool,
}
