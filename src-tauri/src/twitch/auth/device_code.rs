use super::events::{AuthFailed, AuthSucceeded};
use super::scopes::scopes;
use super::CLIENT_ID;
use crate::emit::emit;
use crate::error::Result;
use crate::twitch::users::dto::User;
use crate::twitch::{users, Twitch};
use serde::Serialize;
use twitch_api::twitch_oauth2::DeviceUserTokenBuilder;

#[derive(Serialize, Clone, specta::Type)]
pub struct DcfAuthResponse {
    pub user_code: String,
    pub verification_uri: String,
}

pub async fn get_device_code(app: tauri::AppHandle, twitch: Twitch) -> Result<DcfAuthResponse> {
    let mut builder = DeviceUserTokenBuilder::new(CLIENT_ID, scopes());
    let code = builder.start(&twitch.oauth).await?;
    let response = DcfAuthResponse {
        user_code: code.user_code.clone(),
        verification_uri: code.verification_uri.clone(),
    };
    tauri::async_runtime::spawn(async move {
        match login(&twitch, builder).await {
            Ok(user) => emit(&app, AuthSucceeded(user)),
            Err(e) => {
                log::error!("login failed: {e}");
                emit(&app, AuthFailed(e));
            }
        }
    });
    Ok(response)
}

async fn login(twitch: &Twitch, mut builder: DeviceUserTokenBuilder) -> Result<User> {
    let token = builder
        .wait_for_code(&twitch.oauth, tokio::time::sleep)
        .await?;
    let user = users::get_self(&twitch.with_token(token.clone())).await?;
    twitch.session.set(token);
    Ok(user)
}
