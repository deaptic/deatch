use super::dto::User;
use crate::error::Result;
use crate::twitch::users::{self, GetUsersParams};
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_users(twitch: State<'_, Twitch>, params: GetUsersParams) -> Result<Vec<User>> {
    users::get_users(&twitch.authed().await?, params).await
}
