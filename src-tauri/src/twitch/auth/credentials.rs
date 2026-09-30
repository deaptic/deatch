use crate::error::Result;
use serde::{Deserialize, Serialize};
use twitch_api::twitch_oauth2::UserToken;

#[derive(Serialize, Deserialize)]
pub struct StoredCredentials {
    pub access_token: String,
    pub refresh_token: Option<String>,
}

fn entry() -> Result<keyring_core::Entry> {
    Ok(keyring_core::Entry::new("deatch", "auth")?)
}

pub fn load() -> Result<Option<StoredCredentials>> {
    match entry()?.get_password() {
        Ok(json) => Ok(Some(serde_json::from_str(&json)?)),
        Err(keyring_core::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

pub fn save(token: &UserToken) -> Result<()> {
    let creds = StoredCredentials {
        access_token: token.access_token.secret().to_string(),
        refresh_token: token.refresh_token.as_ref().map(|r| r.secret().to_string()),
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
