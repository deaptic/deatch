use super::auth::credentials;
use super::Helix;
use crate::error::{Error, Result};
use std::time::Duration;
use tokio::sync::Mutex;
use twitch_api::twitch_oauth2::{TwitchToken, UserToken};

const REFRESH_MARGIN: Duration = Duration::from_secs(60);

/// One lock covers reads and refreshes, so callers never race a refresh or
/// a logout.
#[derive(Default)]
pub struct Session {
    token: Mutex<Option<UserToken>>,
}

impl Session {
    pub async fn set(&self, token: UserToken) {
        let mut slot = self.token.lock().await;
        persist(&token);
        *slot = Some(token);
    }

    pub async fn end(&self) -> Result<Option<UserToken>> {
        let mut slot = self.token.lock().await;
        credentials::delete()?;
        Ok(slot.take())
    }

    pub async fn valid(&self, helix: &Helix) -> Result<UserToken> {
        let mut slot = self.token.lock().await;
        let token = slot.as_mut().ok_or(Error::NotAuthenticated)?;
        if token.expires_in() < REFRESH_MARGIN {
            token.refresh_token(helix).await?;
            persist(token);
        }
        Ok(token.clone())
    }
}

fn persist(token: &UserToken) {
    // Losing persistence only costs a re-login next launch; failing the live
    // session over it would be worse.
    if let Err(e) = credentials::save(token) {
        log::warn!("credentials not persisted: {e}");
    }
}
