use super::auth::credentials;
use super::auth::events::SessionEnded;
use super::ids::UserId;
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

    /// Who is signed in, read without refreshing anything.
    pub async fn user_id(&self) -> Option<UserId> {
        let slot = self.token.lock().await;
        slot.as_ref().map(UserId::from)
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
pub(super) fn is_final<E: std::error::Error + Send + Sync + 'static>(
    e: &RefreshTokenError<E>,
) -> bool {
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

#[cfg(test)]
mod tests {
    use super::is_final;
    use http::StatusCode;
    use twitch_api::twitch_oauth2::id::TwitchTokenErrorResponse;
    use twitch_api::twitch_oauth2::tokens::errors::RefreshTokenError;
    use twitch_api::twitch_oauth2::RequestParseError;

    fn twitch_said(status: StatusCode) -> RefreshTokenError<std::io::Error> {
        RefreshTokenError::RequestParseError(RequestParseError::TwitchError(
            TwitchTokenErrorResponse {
                status,
                message: "Invalid refresh token".into(),
                error: None,
            },
        ))
    }

    #[test]
    fn only_a_rejected_or_missing_refresh_token_ends_the_session() {
        assert!(is_final(&twitch_said(StatusCode::BAD_REQUEST)));
        assert!(is_final(
            &RefreshTokenError::<std::io::Error>::NoRefreshToken
        ));
        assert!(!is_final(&twitch_said(StatusCode::SERVICE_UNAVAILABLE)));
        assert!(!is_final(&RefreshTokenError::RequestError(
            std::io::Error::other("offline")
        )));
    }
}
