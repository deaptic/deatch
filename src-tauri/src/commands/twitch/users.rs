use crate::dto::twitch::user::User;
use crate::error::Result;
use crate::services::twitch::users::{self, GetUsersParams};
use crate::services::twitch::Twitch;
use tauri::State;

#[tauri::command]
pub async fn get_users(twitch: State<'_, Twitch>, params: GetUsersParams) -> Result<Vec<User>> {
    users::get_users(&twitch.authed().await?, params).await
}
