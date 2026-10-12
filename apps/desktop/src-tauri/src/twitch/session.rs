use super::auth::credentials;
use super::auth::events::SessionEnded;
use super::Helix;
use crate::emit::emit;
use crate::error::{Error, Result};
use std::time::Duration;
use tokio::sync::Mutex;
use twitch_api::twitch_oauth2::tokens::errors::RefreshTokenError;
use twitch_api::twitch_oauth2::{RequestParseError, TwitchToken, UserToken};

const REFRESH_MARGIN: Duration = Duration::from_secs(60);

/// One lock covers reads and refreshes, so callers never race a refresh or
/// a logout.
pub struct Session {
    app: tauri::AppHandle,
    token: Mutex<Option<UserToken>>,
}

impl Session {
    pub fn new(app: tauri::AppHandle) -> Self {
        Self {
            app,
            token: Mutex::default(),
        }
    }

    pub async fn set(&self, token: UserToken) {
        let mut slot = self.token.lock().await;
        persist(&token);
        *slot = Some(token);
    }

    pub async fn end(&self) -> Option<UserToken> {
        let token = self.token.lock().await.take();
        forget();
        token
    }

    pub async fn valid(&self, helix: &Helix) -> Result<UserToken> {
        let mut slot = self.token.lock().await;
        let token = slot.as_mut().ok_or(Error::NotAuthenticated)?;
        let rejected = helix.get_client().take_unauthorized();
        if rejected || token.expires_in() < REFRESH_MARGIN {
            match token.refresh_token(helix).await {
                Ok(()) => persist(token),
                Err(e) if is_final(&e) => {
                    log::warn!("session ended, token refresh rejected: {e}");
                    slot.take();
                    forget();
                    emit(&self.app, SessionEnded);
                    return Err(Error::NotAuthenticated);
                }
                Err(e) => return Err(e.into()),
            }
        }
        Ok(token.clone())
    }
}

/// Twitch answering 4xx means the refresh token itself is dead; anything
/// else is a blip worth retrying with the same token.
fn is_final<E: std::error::Error + Send + Sync + 'static>(e: &RefreshTokenError<E>) -> bool {
    match e {
        RefreshTokenError::RequestParseError(RequestParseError::TwitchError(r)) => {
            r.status.is_client_error()
        }
        RefreshTokenError::NoRefreshToken => true,
        _ => false,
    }
}

fn persist(token: &UserToken) {
    // Losing persistence only costs a re-login next launch; failing the live
    // session over it would be worse.
    if let Err(e) = credentials::save(token) {
        log::warn!("credentials not persisted: {e}");
    }
}

/// Signing out must win locally even when the keyring is unavailable.
fn forget() {
    if let Err(e) = credentials::delete() {
        log::warn!("credentials not deleted: {e}");
    }
}
