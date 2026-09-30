use super::auth::credentials;
use crate::error::{Error, Result};
use std::sync::RwLock;
use std::time::Duration;
use twitch_api::twitch_oauth2::{TwitchToken, UserToken};

const REFRESH_MARGIN: Duration = Duration::from_secs(60);

pub struct Session {
    token: RwLock<Option<UserToken>>,
    refresh: tokio::sync::Mutex<()>,
}

impl Session {
    pub fn new() -> Self {
        Self {
            token: RwLock::new(None),
            refresh: tokio::sync::Mutex::new(()),
        }
    }

    pub fn current(&self) -> Option<UserToken> {
        self.token.read().unwrap().clone()
    }

    pub fn set(&self, token: UserToken) {
        persist(&token);
        *self.token.write().unwrap() = Some(token);
    }

    pub fn clear(&self) {
        *self.token.write().unwrap() = None;
    }

    pub async fn valid(&self, http: &reqwest::Client) -> Result<UserToken> {
        if let Some(token) = self.fresh()? {
            return Ok(token);
        }
        let _refreshing = self.refresh.lock().await;
        if let Some(token) = self.fresh()? {
            return Ok(token);
        }
        let mut token = self.current().ok_or(Error::NotAuthenticated)?;
        token.refresh_token(http).await?;
        let mut slot = self.token.write().unwrap();
        if slot.is_none() {
            return Err(Error::NotAuthenticated);
        }
        persist(&token);
        *slot = Some(token.clone());
        Ok(token)
    }

    fn fresh(&self) -> Result<Option<UserToken>> {
        let token = self.current().ok_or(Error::NotAuthenticated)?;
        Ok((token.expires_in() >= REFRESH_MARGIN).then_some(token))
    }
}

fn persist(token: &UserToken) {
    // Losing persistence only costs a re-login next launch; failing the live
    // session over it would be worse.
    if let Err(e) = credentials::save(token) {
        eprintln!("[auth] credentials not persisted: {e}");
    }
}
