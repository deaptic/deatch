use crate::dto::twitch::user::User;
use crate::services;
use crate::services::twitch::get_token;
use serde::Deserialize;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetUsersParams {
    pub ids: Vec<String>,
    pub logins: Vec<String>,
}

#[tauri::command]
pub async fn get_users(app: tauri::AppHandle, params: GetUsersParams) -> Result<Vec<User>, String> {
    let token = get_token(&app).await?;
    services::twitch::users::get_users(&token, params.ids, params.logins).await
}
