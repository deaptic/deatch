use super::credentials::{
    delete_stored_credentials, keyring_entry, save_credentials, StoredCredentials,
};
use super::refresh::spawn_token_refresh;
use super::CLIENT_ID;
use crate::dto::twitch::user::User;
use crate::services::twitch::{helix, TwitchState};
use tauri::Manager;
use twitch_api::twitch_oauth2::{Scope, TwitchToken, UserToken};

pub(super) fn get_access_token(app: &tauri::AppHandle) -> Option<UserToken> {
    app.state::<TwitchState>().token.lock().unwrap().clone()
}

pub(super) fn store_session(app: &tauri::AppHandle, token: UserToken) {
    *app.state::<TwitchState>().token.lock().unwrap() = Some(token);
}

pub(super) fn scopes() -> Vec<Scope> {
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
        Scope::ModeratorManageAutoMod,
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
        Scope::ClipsEdit,
    ]
}

pub(super) async fn fetch_user_info(token: &UserToken) -> Result<User, String> {
    let ids = [token.user_id.clone()];
    let helix_user = helix()
        .req_get(twitch_api::helix::users::GetUsersRequest::ids(&ids), token)
        .await
        .map_err(|e| e.to_string())?
        .data
        .into_iter()
        .next()
        .ok_or_else(|| "User not found".to_string())?;
    Ok(User::from(helix_user))
}

pub async fn restore_session(app: &tauri::AppHandle) -> Result<Option<User>, String> {
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
        twitch_api::twitch_oauth2::ClientId::new(CLIENT_ID.to_string()),
        None,
    )
    .await
    .map_err(|e| e.to_string())?;

    let required = scopes();
    let token_scopes = token.scopes();
    for scope in &required {
        if !token_scopes.contains(scope) {
            delete_stored_credentials();
            return Err(format!(
                "Token missing scope: {scope}, please re-authenticate"
            ));
        }
    }

    let user_info = fetch_user_info(&token).await?;
    save_credentials(&token);
    store_session(app, token);
    spawn_token_refresh(app.clone());
    Ok(Some(user_info))
}

pub async fn revoke_session(app: &tauri::AppHandle) -> Result<(), String> {
    if let Some(t) = get_access_token(app) {
        let http_client = reqwest::Client::new();
        let _ = t.revoke_token(&http_client).await;
    }
    delete_stored_credentials();
    *app.state::<TwitchState>().token.lock().unwrap() = None;
    *app.state::<TwitchState>().eventsub_tx.lock().unwrap() = None;
    Ok(())
}
