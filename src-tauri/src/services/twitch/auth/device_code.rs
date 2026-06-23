use super::credentials::save_credentials;
use super::refresh::spawn_token_refresh;
use super::session::{fetch_user_info, scopes, store_session};
use super::CLIENT_ID;
use serde::Serialize;
use tauri::Emitter;
use twitch_api::twitch_oauth2::id::DeviceCodeResponse;
use twitch_api::twitch_oauth2::DeviceUserTokenBuilder;

#[derive(Serialize, Clone)]
pub struct DcfAuthResponse {
    pub user_code: String,
    pub verification_uri: String,
}

async fn request_dcf_code(
) -> Result<(DeviceUserTokenBuilder, reqwest::Client, DeviceCodeResponse), String> {
    let mut builder = DeviceUserTokenBuilder::new(CLIENT_ID, scopes());
    let http_client = reqwest::Client::new();
    let code = builder
        .start(&http_client)
        .await
        .map_err(|e| e.to_string())?
        .clone();
    Ok((builder, http_client, code))
}

async fn request_token(
    mut builder: DeviceUserTokenBuilder,
    http_client: &reqwest::Client,
) -> Result<twitch_api::twitch_oauth2::UserToken, String> {
    builder
        .wait_for_code(http_client, tokio::time::sleep)
        .await
        .map_err(|e| e.to_string())
}

async fn listen_device_code_callback(
    app: tauri::AppHandle,
    builder: DeviceUserTokenBuilder,
    http_client: reqwest::Client,
) {
    let result = async {
        let token = request_token(builder, &http_client).await?;
        let user_info = fetch_user_info(&token).await?;
        save_credentials(&token);
        store_session(&app, token);
        spawn_token_refresh(app.clone());
        let _ = app.emit("twitch-auth-success", user_info);
        Ok::<_, String>(())
    }
    .await;
    if let Err(e) = result {
        let _ = app.emit("twitch-auth-error", e);
    }
}

pub async fn get_device_code(app: tauri::AppHandle) -> Result<DcfAuthResponse, String> {
    let (builder, http_client, code) = request_dcf_code().await?;
    let response = DcfAuthResponse {
        user_code: code.user_code,
        verification_uri: code.verification_uri,
    };
    tauri::async_runtime::spawn(listen_device_code_callback(app, builder, http_client));
    Ok(response)
}
