use super::TwitchState;
use tauri::{Emitter, Manager};
use twitch_api::helix::users::User;
use twitch_api::twitch_oauth2::id::DeviceCodeResponse;
use twitch_api::twitch_oauth2::{DeviceUserTokenBuilder, Scope, TwitchToken, UserToken};

#[derive(serde::Serialize, serde::Deserialize)]
struct StoredCredentials {
    access_token: String,
    refresh_token: Option<String>,
}

fn keyring_entry() -> Result<keyring_core::Entry, String> {
    keyring_core::Entry::new("deatch", "auth").map_err(|e| e.to_string())
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
    app.state::<TwitchState>().token.lock().unwrap().clone()
}

fn store_session(app: &tauri::AppHandle, token: UserToken) {
    *app.state::<TwitchState>().token.lock().unwrap() = Some(token);
}

pub async fn refresh_token_now(app: &tauri::AppHandle) -> Result<(), String> {
    let mut token = get_access_token(app).ok_or_else(|| "Not authenticated".to_string())?;
    // Without an explicit timeout reqwest will wait indefinitely on a stalled
    // connection, which has bricked the refresh loop in the past.
    let http_client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    token
        .refresh_token(&http_client)
        .await
        .map_err(|e| e.to_string())?;
    save_credentials(&token);
    *app.state::<TwitchState>().token.lock().unwrap() = Some(token);
    Ok(())
}

pub fn spawn_token_refresh(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            // Sleep duration shrinks as the token approaches expiry so a
            // failed refresh retries quickly while there's still time left.
            let sleep_for = {
                let state = app.state::<TwitchState>();
                let guard = state.token.lock().unwrap();
                match guard.as_ref() {
                    None => std::time::Duration::from_secs(60),
                    Some(t) => {
                        let remaining = t.expires_in();
                        if remaining < std::time::Duration::from_secs(120) {
                            std::time::Duration::from_secs(10)
                        } else {
                            std::time::Duration::from_secs(60)
                        }
                    }
                }
            };
            tokio::time::sleep(sleep_for).await;

            let needs_refresh = {
                let state = app.state::<TwitchState>();
                let guard = state.token.lock().unwrap();
                match guard.as_ref() {
                    None => false,
                    Some(t) => t.expires_in() < std::time::Duration::from_secs(600),
                }
            };
            if needs_refresh {
                if let Err(e) = refresh_token_now(&app).await {
                    let _ = app.emit("twitch-auth-error", format!("refresh failed: {e}"));
                }
            }
        }
    });
}

async fn fetch_user_info(token: &UserToken) -> Result<User, String> {
    let ids = [token.user_id.clone()];
    super::helix()
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
        Scope::ModeratorManageAnnouncements,
        Scope::ModeratorManageChatSettings,
        Scope::ModeratorManageWarnings,
        Scope::ModeratorReadFollowers,
        Scope::ModeratorManageBannedUsers,
        Scope::ModeratorReadBlockedTerms,
        Scope::ModeratorReadChatSettings,
        Scope::ModeratorReadUnbanRequests,
        Scope::ModeratorReadModerators,
        Scope::ModeratorReadVips,
        Scope::ModeratorReadWarnings,
        Scope::ChannelManageVips,
        Scope::ChannelManageRaids,
        Scope::ChannelManageBroadcast,
        Scope::ChannelEditCommercial,
        Scope::UserManageChatColor,
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
pub async fn restore_session(app: tauri::AppHandle) -> Result<Option<User>, String> {
    let entry = keyring_entry()?;
    let json = match entry.get_password() {
        Ok(s) => s,
        // No stored credentials — first launch or after logout. Not an error;
        // the frontend treats `Ok(None)` as "show the login screen, no toast".
        Err(keyring_core::Error::NoEntry) => return Ok(None),
        Err(e) => return Err(e.to_string()),
    };
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
                let _ = entry.delete_credential();
            }
            return Err(format!(
                "Token missing scope: {scope}, please re-authenticate"
            ));
        }
    }

    let user_info = fetch_user_info(&token).await?;
    save_credentials(&token);
    store_session(&app, token);
    spawn_token_refresh(app.clone());
    Ok(Some(user_info))
}

#[tauri::command]
pub async fn revoke_session(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(t) = get_access_token(&app) {
        let _ = request_revoke(t).await;
    }
    if let Ok(entry) = keyring_entry() {
        let _ = entry.delete_credential();
    }
    *app.state::<TwitchState>().token.lock().unwrap() = None;
    *app.state::<TwitchState>().eventsub_tx.lock().unwrap() = None;
    Ok(())
}
