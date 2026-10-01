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
pub mod raids;
pub mod search;
pub mod session;
pub mod streams;
pub mod template;
mod transport;
pub mod users;

use crate::error::Result;
use session::Session;
use std::collections::HashSet;
use std::sync::{Arc, Mutex};
use twitch_api::twitch_oauth2::UserToken;
use twitch_api::HelixClient;
use users::dto::UserRef;

pub type Helix = HelixClient<'static, transport::HelixTransport>;

#[derive(Clone)]
pub struct Twitch {
    http: reqwest::Client,
    helix: Helix,
    session: Arc<Session>,
    eventsub: Arc<eventsub::Handle>,
    moderated_channel_ids: Arc<Mutex<HashSet<String>>>,
}

pub struct Authed<'a> {
    pub helix: &'a Helix,
    pub token: UserToken,
}

impl Twitch {
    pub fn new(http: reqwest::Client) -> Self {
        Self {
            helix: HelixClient::with_client(transport::HelixTransport::new(http.clone())),
            http,
            session: Arc::new(Session::new()),
            eventsub: Arc::default(),
            moderated_channel_ids: Arc::default(),
        }
    }

    pub async fn authed(&self) -> Result<Authed<'_>> {
        let token = self.session.valid(&self.http).await?;
        Ok(self.with_token(token))
    }

    fn with_token(&self, token: UserToken) -> Authed<'_> {
        Authed {
            helix: &self.helix,
            token,
        }
    }

    fn cache_moderated_channel_ids(&self, channels: &[UserRef]) {
        *self.moderated_channel_ids.lock().unwrap() =
            channels.iter().map(|ch| ch.id.0.clone()).collect();
    }
}
