use super::dto::{Category, SearchChannel};
use crate::error::Result;
use crate::twitch::search::{self, SearchCategoriesParams, SearchChannelsParams};
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn search_channels(
    twitch: State<'_, Twitch>,
    params: SearchChannelsParams,
) -> Result<Vec<SearchChannel>> {
    search::search_channels(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn search_categories(
    twitch: State<'_, Twitch>,
    params: SearchCategoriesParams,
) -> Result<Vec<Category>> {
    search::search_categories(&twitch.authed().await?, params).await
}
