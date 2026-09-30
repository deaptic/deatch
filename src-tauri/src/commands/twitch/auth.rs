use crate::dto::twitch::user::User;
use crate::error::Result;
use crate::services;
use crate::services::twitch::auth::DcfAuthResponse;
use crate::services::twitch::Twitch;
use tauri::State;

#[tauri::command]
pub async fn get_device_code(app: tauri::AppHandle) -> Result<DcfAuthResponse> {
    services::twitch::auth::get_device_code(app).await
}

#[tauri::command]
pub async fn restore_session(twitch: State<'_, Twitch>) -> Result<Option<User>> {
    services::twitch::auth::restore_session(&twitch).await
}

#[tauri::command]
pub async fn revoke_session(twitch: State<'_, Twitch>) -> Result<()> {
    services::twitch::auth::revoke_session(&twitch).await
}
