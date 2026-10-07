pub mod commands;
pub(super) mod credentials;
pub mod dto;
pub mod events;

use super::users::dto::User;
use super::{users, Twitch};
use crate::emit::emit;
use crate::error::{Error, Result};
use dto::DcfAuthResponse;
use events::{AuthFailed, AuthSucceeded};
use twitch_api::twitch_oauth2::{
    AccessToken, ClientId, DeviceUserTokenBuilder, RefreshToken, Scope, TwitchToken, UserToken,
};

const CLIENT_ID: &str = "9zz5nm0knwecx9icd0xbkmkpnrdhjr";

const SCOPES: [Scope; 28] = [
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
];

pub async fn get_device_code(app: tauri::AppHandle, twitch: Twitch) -> Result<DcfAuthResponse> {
    let mut builder = DeviceUserTokenBuilder::new(CLIENT_ID, SCOPES.to_vec());
    let code = builder.start(&twitch.helix).await?;
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
        .wait_for_code(&twitch.helix, tokio::time::sleep)
        .await?;
    start_session(twitch, token).await
}

pub async fn restore_session(twitch: &Twitch) -> Result<Option<User>> {
    // No stored credentials is first launch or after logout, not an error;
    // the frontend treats `None` as "show the login screen, no toast".
    let Some(creds) = credentials::load()? else {
        return Ok(None);
    };
    let token = UserToken::from_existing_or_refresh_token(
        &twitch.helix,
        AccessToken::new(creds.access_token),
        RefreshToken::new(creds.refresh_token),
        ClientId::new(CLIENT_ID.to_string()),
        None,
    )
    .await?;
    if let Some(missing) = SCOPES.iter().find(|s| !token.scopes().contains(s)) {
        credentials::delete()?;
        return Err(Error::Auth(format!(
            "token missing scope {missing}, please re-authenticate"
        )));
    }
    start_session(twitch, token).await.map(Some)
}

async fn start_session(twitch: &Twitch, token: UserToken) -> Result<User> {
    let user = users::get_self(&twitch.with_token(token.clone())).await?;
    twitch.session.set(token).await;
    Ok(user)
}

pub async fn revoke_session(twitch: &Twitch) -> Result<()> {
    let token = twitch.session.end().await?;
    twitch.eventsub.clear();
    if let Some(token) = token {
        // Logging out must succeed locally even when Twitch is unreachable;
        // an unrevoked token just expires on its own.
        if let Err(e) = token.revoke_token(&twitch.helix).await {
            log::warn!("token revoke failed: {e}");
        }
    }
    Ok(())
}
