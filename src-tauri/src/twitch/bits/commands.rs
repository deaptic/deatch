use super::dto::Cheermote;
use crate::error::Result;
use crate::twitch::bits::{self, GetCheermotesParams};
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_cheermotes(
    twitch: State<'_, Twitch>,
    params: GetCheermotesParams,
) -> Result<Vec<Cheermote>> {
    bits::get_cheermotes(&twitch.authed().await?, params).await
}
