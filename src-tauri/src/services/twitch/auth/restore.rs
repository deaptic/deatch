use super::scopes::scopes;
use super::{credentials, CLIENT_ID};
use crate::dto::twitch::user::User;
use crate::error::{Error, Result};
use crate::services::twitch::{users, Twitch};
use twitch_api::twitch_oauth2::{AccessToken, ClientId, RefreshToken, TwitchToken, UserToken};

pub async fn restore_session(twitch: &Twitch) -> Result<Option<User>> {
    // No stored credentials is first launch or after logout, not an error;
    // the frontend treats `None` as "show the login screen, no toast".
    let Some(creds) = credentials::load()? else {
        return Ok(None);
    };
    let refresh_token = creds.refresh_token.ok_or_else(|| {
        Error::Auth("stored credentials missing refresh token, please re-authenticate".into())
    })?;
    let token = UserToken::from_existing_or_refresh_token(
        &twitch.http,
        AccessToken::new(creds.access_token),
        RefreshToken::new(refresh_token),
        ClientId::new(CLIENT_ID.to_string()),
        None,
    )
    .await?;

    let granted = token.scopes();
    if let Some(missing) = scopes().into_iter().find(|s| !granted.contains(s)) {
        credentials::delete()?;
        return Err(Error::Auth(format!(
            "token missing scope {missing}, please re-authenticate"
        )));
    }

    let user = users::get_self(&twitch.with_token(token.clone())).await?;
    twitch.session.set(token);
    Ok(Some(user))
}
