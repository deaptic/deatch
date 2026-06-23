use serde::{Deserialize, Serialize};
use twitch_api::twitch_oauth2::UserToken;

#[derive(Serialize, Deserialize)]
pub(super) struct StoredCredentials {
    pub(super) access_token: String,
    pub(super) refresh_token: Option<String>,
}

pub(super) fn keyring_entry() -> Result<keyring_core::Entry, String> {
    keyring_core::Entry::new("deatch", "auth").map_err(|e| e.to_string())
}

pub(super) fn save_credentials(token: &UserToken) {
    let entry = match keyring_entry() {
        Ok(entry) => entry,
        Err(e) => {
            eprintln!("[auth] keyring unavailable, credentials not persisted: {e}");
            return;
        }
    };
    let creds = StoredCredentials {
        access_token: token.access_token.secret().to_string(),
        refresh_token: token.refresh_token.as_ref().map(|r| r.secret().to_string()),
    };
    let json = match serde_json::to_string(&creds) {
        Ok(json) => json,
        Err(e) => {
            eprintln!("[auth] failed to serialize credentials: {e}");
            return;
        }
    };
    if let Err(e) = entry.set_password(&json) {
        eprintln!("[auth] failed to persist credentials: {e}");
    }
}

pub(super) fn delete_stored_credentials() {
    let entry = match keyring_entry() {
        Ok(entry) => entry,
        Err(e) => {
            eprintln!("[auth] keyring unavailable, stored credentials not cleared: {e}");
            return;
        }
    };
    if let Err(e) = entry.delete_credential() {
        eprintln!("[auth] failed to clear stored credentials: {e}");
    }
}
