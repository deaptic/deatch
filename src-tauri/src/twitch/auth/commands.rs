use super::dto::DcfAuthResponse;
use crate::error::Result;
use crate::twitch::users::dto::User;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_device_code(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
) -> Result<DcfAuthResponse> {
    super::get_device_code(app, twitch.inner().clone()).await
}

#[tauri::command]
#[specta::specta]
pub fn cancel_login(twitch: State<'_, Twitch>) {
    super::cancel_login(&twitch)
}

#[tauri::command]
#[specta::specta]
pub async fn restore_session(twitch: State<'_, Twitch>) -> Result<Option<User>> {
    super::restore_session(&twitch).await
}

#[tauri::command]
#[specta::specta]
pub async fn revoke_session(twitch: State<'_, Twitch>) -> Result<()> {
    super::revoke_session(&twitch).await
}
