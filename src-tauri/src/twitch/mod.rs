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
use std::sync::Arc;
use twitch_api::twitch_oauth2::UserToken;
use twitch_api::HelixClient;

pub type Helix = HelixClient<'static, transport::HelixTransport>;

#[derive(Clone)]
pub struct Twitch {
    helix: Helix,
    session: Arc<Session>,
    eventsub: Arc<eventsub::Handle>,
}

pub struct Authed<'a> {
    pub helix: &'a Helix,
    pub token: UserToken,
}

impl Twitch {
    pub fn new(http: reqwest::Client) -> Self {
        Self {
            helix: HelixClient::with_client(transport::HelixTransport::new(http)),
            session: Arc::default(),
            eventsub: Arc::default(),
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
