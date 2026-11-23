use super::dto::Subscription;
use crate::error::Result;
use crate::twitch::params::BroadcasterUserParams;
use crate::twitch::subscriptions;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_subscription(
    twitch: State<'_, Twitch>,
    params: BroadcasterUserParams,
) -> Result<Option<Subscription>> {
    subscriptions::get_subscription(&twitch.authed().await?, params).await
}
