use crate::error::{Error, Result};
use serde::{Deserialize, Serialize};
use twitch_api::twitch_oauth2::UserToken;

#[derive(Serialize, Deserialize)]
pub struct StoredCredentials {
    pub access_token: String,
    pub refresh_token: String,
}

fn entry() -> Result<keyring_core::Entry> {
    Ok(keyring_core::Entry::new("deatch", "auth")?)
}

/// Unreadable credentials can't be restored either way, so they are
/// forgotten and the user simply signs in again.
pub fn load() -> Result<Option<StoredCredentials>> {
    let json = match entry()?.get_password() {
        Ok(json) => json,
        Err(keyring_core::Error::NoEntry) => return Ok(None),
        Err(e) => return Err(e.into()),
    };
    match serde_json::from_str(&json) {
        Ok(creds) => Ok(Some(creds)),
        Err(e) => {
            log::warn!("stored credentials unreadable, signing out: {e}");
            delete()?;
            Ok(None)
        }
    }
}

pub fn save(token: &UserToken) -> Result<()> {
    let refresh_token = token
        .refresh_token
        .as_ref()
        .ok_or_else(|| Error::Auth("token has no refresh token".into()))?;
    let creds = StoredCredentials {
        access_token: token.access_token.secret().to_string(),
        refresh_token: refresh_token.secret().to_string(),
    };
    entry()?.set_password(&serde_json::to_string(&creds)?)?;
    Ok(())
}

pub fn delete() -> Result<()> {
    match entry()?.delete_credential() {
        Ok(()) | Err(keyring_core::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.into()),
    }
}
