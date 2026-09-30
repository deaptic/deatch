use crate::error::Error;
use crate::twitch::users::dto::User;
use serde::Serialize;

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
pub struct AuthSucceeded(pub User);

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
pub struct AuthFailed(pub Error);
