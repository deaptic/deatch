use crate::dto::twitch::user::User;
use crate::error::Result;
use crate::services;
use crate::services::twitch::Twitch;
use serde::Deserialize;
use tauri::State;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetUsersParams {
    pub ids: Vec<String>,
    pub logins: Vec<String>,
}

#[tauri::command]
pub async fn get_users(twitch: State<'_, Twitch>, params: GetUsersParams) -> Result<Vec<User>> {
    let twitch = twitch.authed().await?;
    services::twitch::users::get_users(&twitch, params.ids, params.logins).await
}
