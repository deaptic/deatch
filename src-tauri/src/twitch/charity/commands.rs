use super::dto::CharityCampaign;
use crate::error::Result;
use crate::twitch::charity;
use crate::twitch::params::BroadcasterParams;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_charity_campaign(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Option<CharityCampaign>> {
    charity::get_charity_campaign(&twitch.authed().await?, params).await
}
