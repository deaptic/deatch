use crate::twitch::users::dto::UserRef;
use serde::Serialize;

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
pub struct ModeratedChannelsChanged(pub Vec<UserRef>);
