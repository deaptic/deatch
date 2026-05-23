use crate::dto::twitch::user::User;
use crate::services;
use crate::services::twitch::auth::DcfAuthResponse;

#[tauri::command]
pub async fn get_device_code(app: tauri::AppHandle) -> Result<DcfAuthResponse, String> {
    services::twitch::auth::get_device_code(app).await
}

#[tauri::command]
pub async fn restore_session(app: tauri::AppHandle) -> Result<Option<User>, String> {
    services::twitch::auth::restore_session(&app).await
}

#[tauri::command]
pub async fn revoke_session(app: tauri::AppHandle) -> Result<(), String> {
    services::twitch::auth::revoke_session(&app).await
}
