use super::{AppendParams, AroundParams, PageParams};
use crate::db;
use crate::error::Result;
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
pub async fn feedlog_clear(app: tauri::AppHandle, twitch: State<'_, Twitch>) -> Result<()> {
    db::run(app, twitch.viewer().await?, |db| super::clear(db)).await
}
