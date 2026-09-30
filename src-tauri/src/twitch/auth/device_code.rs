use super::scopes::scopes;
use super::CLIENT_ID;
use crate::error::Result;
use crate::twitch::{users, Twitch};
use serde::Serialize;
use tauri::{Emitter, Manager};
use twitch_api::twitch_oauth2::DeviceUserTokenBuilder;

#[derive(Serialize, Clone, specta::Type)]
pub struct DcfAuthResponse {
    pub user_code: String,
    pub verification_uri: String,
}

pub async fn get_device_code(app: tauri::AppHandle) -> Result<DcfAuthResponse> {
    let mut builder = DeviceUserTokenBuilder::new(CLIENT_ID, scopes());
    let code = builder.start(&app.state::<Twitch>().http).await?;
    let response = DcfAuthResponse {
        user_code: code.user_code.clone(),
        verification_uri: code.verification_uri.clone(),
    };
    tauri::async_runtime::spawn(await_login(app, builder));
    Ok(response)
}

async fn await_login(app: tauri::AppHandle, builder: DeviceUserTokenBuilder) {
    match login(&app, builder).await {
        Ok(user) => {
            let _ = app.emit("twitch-auth-success", user);
        }
        Err(e) => {
            let _ = app.emit("twitch-auth-error", e.to_string());
        }
    }
}

async fn login(
    app: &tauri::AppHandle,
    mut builder: DeviceUserTokenBuilder,
) -> Result<crate::twitch::users::dto::User> {
    let twitch = app.state::<Twitch>();
    let token = builder
        .wait_for_code(&twitch.http, tokio::time::sleep)
        .await?;
    let user = users::get_self(&twitch.with_token(token.clone())).await?;
    twitch.session.set(token);
    Ok(user)
}
