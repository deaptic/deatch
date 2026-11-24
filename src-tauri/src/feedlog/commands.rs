use super::{AppendParams, AroundParams, FeedlogHit, FeedlogSearchParams, PageParams};
use crate::platform::db;
use crate::platform::error::Result;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn feedlog_append(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: AppendParams,
) -> Result<()> {
    db::run(app, twitch.viewer().await?, |db| super::append(db, params)).await
}

#[tauri::command]
#[specta::specta]
pub async fn feedlog_page(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: PageParams,
) -> Result<Vec<String>> {
    db::run(app, twitch.viewer().await?, |db| super::page(db, params)).await
}

#[tauri::command]
#[specta::specta]
pub async fn feedlog_around(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: AroundParams,
) -> Result<Option<Vec<String>>> {
    db::run(app, twitch.viewer().await?, |db| super::around(db, params)).await
}

#[tauri::command]
#[specta::specta]
pub async fn feedlog_search(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: FeedlogSearchParams,
) -> Result<Vec<FeedlogHit>> {
    db::run(app, twitch.viewer().await?, |db| super::search(db, params)).await
}

#[tauri::command]
#[specta::specta]
pub async fn feedlog_clear(app: tauri::AppHandle, twitch: State<'_, Twitch>) -> Result<()> {
    db::run(app, twitch.viewer().await?, |db| super::clear(db)).await
}
