use crate::AppState;
use tauri::{Emitter, Manager};
use twitch_api::helix::users::User;
use twitch_api::twitch_oauth2::id::DeviceCodeResponse;
use twitch_api::twitch_oauth2::{DeviceUserTokenBuilder, Scope, TwitchToken, UserToken};

#[derive(serde::Serialize, serde::Deserialize)]
struct StoredCredentials {
    access_token: String,
    refresh_token: Option<String>,
}

fn keyring_entry() -> Result<keyring::Entry, String> {
    keyring::Entry::new("deatch", "auth").map_err(|e| e.to_string())
}

fn save_credentials(token: &UserToken) {
    let Ok(entry) = keyring_entry() else { return };
    let creds = StoredCredentials {
        access_token: token.access_token.secret().to_string(),
        refresh_token: token.refresh_token.as_ref().map(|r| r.secret().to_string()),
    };
    if let Ok(json) = serde_json::to_string(&creds) {
        let _ = entry.set_password(&json);
    }
}

fn get_access_token(app: &tauri::AppHandle) -> Option<UserToken> {
    app.state::<AppState>().token.lock().unwrap().clone()
}

fn store_session(app: &tauri::AppHandle, token: UserToken, user: User) {
    *app.state::<AppState>().token.lock().unwrap() = Some(token);
    *app.state::<AppState>().user_info.lock().unwrap() = Some(user);
}

pub async fn refresh_token_now(app: &tauri::AppHandle) -> bool {
    let mut token = match get_access_token(app) {
        Some(t) => t,
        None => return false,
    };
    let http_client = reqwest::Client::new();
    if token.refresh_token(&http_client).await.is_ok() {
        save_credentials(&token);
        *app.state::<AppState>().token.lock().unwrap() = Some(token);
        true
    } else {
        false
    }
}

pub fn spawn_token_refresh(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_secs(60)).await;
            let needs_refresh = {
                let state = app.state::<AppState>();
                let guard = state.token.lock().unwrap();
                match guard.as_ref() {
                    None => false,
                    Some(t) => t.expires_in() < std::time::Duration::from_secs(600),
                }
            };
            if needs_refresh {
                let _ = refresh_token_now(&app).await;
            }
        }
    });
}

async fn fetch_user_info(token: &UserToken) -> Result<User, String> {
    let ids = [token.user_id.clone()];
    crate::helix()
        .req_get(twitch_api::helix::users::GetUsersRequest::ids(&ids), token)
        .await
        .map_err(|e| e.to_string())?
        .data
        .into_iter()
        .next()
        .ok_or_else(|| "User not found".to_string())
}

fn get_client_id() -> &'static str {
    "9zz5nm0knwecx9icd0xbkmkpnrdhjr"
}

fn get_scopes() -> Vec<Scope> {
    vec![
        Scope::ChannelReadRedemptions,
        Scope::ModerationRead,
        Scope::UserReadModeratedChannels,
        Scope::UserReadChat,
        Scope::UserReadEmotes,
        Scope::UserReadFollows,
        Scope::UserWriteChat,
        Scope::UserBot,
        Scope::ModeratorManageChatMessages,
        Scope::ModeratorManageShoutouts,
        Scope::ModeratorReadFollowers,
    ]
}

pub async fn request_dcf_code(
) -> Result<(DeviceUserTokenBuilder, reqwest::Client, DeviceCodeResponse), String> {
    let mut builder = DeviceUserTokenBuilder::new(get_client_id(), get_scopes());
    let http_client = reqwest::Client::new();
    let code = builder
        .start(&http_client)
        .await
        .map_err(|e| e.to_string())?
        .clone();
    Ok((builder, http_client, code))
}

pub async fn request_token(
    mut builder: DeviceUserTokenBuilder,
    http_client: &reqwest::Client,
) -> Result<UserToken, String> {
    builder
        .wait_for_code(http_client, tokio::time::sleep)
        .await
        .map_err(|e| e.to_string())
}

pub async fn request_revoke(token: UserToken) -> Result<(), String> {
    let http_client = reqwest::Client::new();
    token
        .revoke_token(&http_client)
        .await
        .map_err(|e| format!("{e}"))
}

#[derive(serde::Serialize, Clone)]
pub struct DcfAuthResponse {
    pub user_code: String,
    pub verification_uri: String,
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
        store_session(&app, token, user_info.clone());
        spawn_token_refresh(app.clone());
        let _ = app.emit("twitch-auth-success", user_info);
        Ok::<_, String>(())
    }
    .await;
    if let Err(e) = result {
        let _ = app.emit("twitch-auth-error", e);
    }
}

#[tauri::command]
pub async fn get_device_code(app: tauri::AppHandle) -> Result<DcfAuthResponse, String> {
    let (builder, http_client, code) = request_dcf_code().await?;
    let response = DcfAuthResponse {
        user_code: code.user_code,
        verification_uri: code.verification_uri,
    };
    tauri::async_runtime::spawn(listen_device_code_callback(app, builder, http_client));
    Ok(response)
}

#[tauri::command]
pub async fn restore_session(app: tauri::AppHandle) -> Result<User, String> {
    let entry = keyring_entry()?;
    let json = entry.get_password().map_err(|e| e.to_string())?;
    let creds: StoredCredentials = serde_json::from_str(&json).map_err(|e| e.to_string())?;

    let http_client = reqwest::Client::new();
    let refresh_token = creds
        .refresh_token
        .ok_or("Stored credentials missing refresh token, please re-authenticate")?;
    let token = UserToken::from_existing_or_refresh_token(
        &http_client,
        twitch_api::twitch_oauth2::AccessToken::new(creds.access_token),
        twitch_api::twitch_oauth2::RefreshToken::new(refresh_token),
        twitch_api::twitch_oauth2::ClientId::new(get_client_id().to_string()),
        None,
    )
    .await
    .map_err(|e| e.to_string())?;

    let required = get_scopes();
    let token_scopes = token.scopes();
    for scope in &required {
        if !token_scopes.contains(scope) {
            if let Ok(entry) = keyring_entry() {
                let _ = entry.delete_password();
            }
            return Err(format!(
                "Token missing scope: {scope}, please re-authenticate"
            ));
        }
    }

    let user_info = fetch_user_info(&token).await?;
    save_credentials(&token);
    store_session(&app, token, user_info.clone());
    spawn_token_refresh(app.clone());
    Ok(user_info)
}

#[tauri::command]
pub async fn revoke_session(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(t) = get_access_token(&app) {
        let _ = request_revoke(t).await;
    }
    if let Ok(entry) = keyring_entry() {
        let _ = entry.delete_password();
    }
    *app.state::<AppState>().token.lock().unwrap() = None;
    *app.state::<AppState>().user_info.lock().unwrap() = None;
    *app.state::<AppState>().chat_cmd_tx.lock().unwrap() = None;
    Ok(())
}
