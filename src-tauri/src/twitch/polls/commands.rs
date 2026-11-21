use super::dto::Poll;
use crate::error::Result;
use crate::twitch::params::BroadcasterParams;
use crate::twitch::polls::{self, CreatePollParams, EndPollParams};
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_active_poll(
    twitch: State<'_, Twitch>,
    params: BroadcasterParams,
) -> Result<Option<Poll>> {
    polls::get_active_poll(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn create_poll(twitch: State<'_, Twitch>, params: CreatePollParams) -> Result<()> {
    polls::create_poll(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn end_poll(twitch: State<'_, Twitch>, params: EndPollParams) -> Result<()> {
    polls::end_poll(&twitch.authed().await?, params).await
}
