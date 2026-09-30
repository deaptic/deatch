use super::DcfAuthResponse;
use crate::error::Result;
use crate::twitch::users::dto::User;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
pub async fn get_device_code(app: tauri::AppHandle) -> Result<DcfAuthResponse> {
    super::get_device_code(app).await
}

#[tauri::command]
pub async fn restore_session(twitch: State<'_, Twitch>) -> Result<Option<User>> {
    super::restore_session(&twitch).await
}

#[tauri::command]
pub async fn revoke_session(twitch: State<'_, Twitch>) -> Result<()> {
    super::revoke_session(&twitch).await
}
