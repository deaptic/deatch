use super::credentials;
use crate::error::Result;
use crate::twitch::Twitch;
use twitch_api::twitch_oauth2::TwitchToken;

pub async fn revoke_session(twitch: &Twitch) -> Result<()> {
    if let Some(token) = twitch.session.current() {
        // Logging out must succeed locally even when Twitch is unreachable;
        // an unrevoked token just expires on its own.
        if let Err(e) = token.revoke_token(&twitch.http).await {
            eprintln!("[auth] token revoke failed: {e}");
        }
    }
    twitch.session.clear();
    twitch.eventsub.stop();
    credentials::delete()
}
