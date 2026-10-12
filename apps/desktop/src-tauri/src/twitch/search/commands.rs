use super::dto::{Category, SearchChannel};
use crate::error::Result;
use crate::twitch::search::{self, SearchParams};
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn search_channels(
    twitch: State<'_, Twitch>,
    params: SearchParams,
) -> Result<Vec<SearchChannel>> {
    search::search_channels(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn search_categories(
    twitch: State<'_, Twitch>,
    params: SearchParams,
) -> Result<Vec<Category>> {
    search::search_categories(&twitch.authed().await?, params).await
}
