pub mod auth;
pub mod bits;
pub mod channels;
pub mod chat;
pub mod clips;
pub mod eventsub;
pub mod game;
pub mod ids;
pub mod moderation;
pub mod pagination;
pub mod params;
pub mod raids;
pub mod search;
pub mod session;
pub mod streams;
pub mod template;
mod transport;
pub mod users;

use crate::error::Result;
use session::Session;
use std::sync::{Arc, Mutex};
use tauri::async_runtime::JoinHandle;
use twitch_api::twitch_oauth2::UserToken;
use twitch_api::HelixClient;

pub type Helix = HelixClient<'static, transport::HelixTransport>;

#[derive(Clone)]
pub struct Twitch {
    helix: Helix,
    session: Arc<Session>,
    eventsub: Arc<eventsub::Handle>,
    /// The device-code poll in flight, so a new or cancelled sign-in can
    /// stop it instead of letting it run for its 30 min lifetime.
    login: Arc<Mutex<Option<JoinHandle<()>>>>,
}

pub struct Authed<'a> {
    pub helix: &'a Helix,
    pub token: UserToken,
}

impl Twitch {
    pub fn new(http: reqwest::Client, app: tauri::AppHandle) -> Self {
        Self {
            helix: HelixClient::with_client(transport::HelixTransport::new(http)),
            session: Arc::new(Session::new(app)),
            eventsub: Arc::default(),
            login: Arc::default(),
        }
    }

    pub fn replace_login(&self, task: Option<JoinHandle<()>>) {
        let previous = std::mem::replace(&mut *self.login.lock().unwrap(), task);
        if let Some(previous) = previous {
            previous.abort();
        }
    }

    pub async fn authed(&self) -> Result<Authed<'_>> {
        let token = self.session.valid(&self.helix).await?;
        Ok(self.with_token(token))
    }

    fn with_token(&self, token: UserToken) -> Authed<'_> {
        Authed {
            helix: &self.helix,
            token,
        }
    }

    fn rate_limited_for(&self) -> Option<std::time::Duration> {
        self.helix.get_client().paused_for()
    }

    pub fn eventsub_stats(&self) -> eventsub::dto::EventSubStats {
        self.eventsub.stats()
    }
}
