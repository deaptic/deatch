use super::{AppendParams, AroundParams, PageParams};
use crate::blocking;
use crate::db::Databases;
use crate::error::Result;
use crate::twitch::Twitch;
use tauri::{Manager, State};

// Each call reads and writes the signed-in account's own database.

#[tauri::command]
#[specta::specta]
pub async fn feedlog_append(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: AppendParams,
) -> Result<()> {
    let viewer = twitch.viewer().await?;
    blocking::run(app, move |app| {
        app.state::<Databases>()
            .with(&viewer, |db| super::append(db, params))
    })
    .await?
}

#[tauri::command]
#[specta::specta]
pub async fn feedlog_page(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: PageParams,
) -> Result<Vec<String>> {
    let viewer = twitch.viewer().await?;
    blocking::run(app, move |app| {
        app.state::<Databases>()
            .with(&viewer, |db| super::page(db, params))
    })
    .await?
}

#[tauri::command]
#[specta::specta]
pub async fn feedlog_around(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: AroundParams,
) -> Result<Option<Vec<String>>> {
    let viewer = twitch.viewer().await?;
    blocking::run(app, move |app| {
        app.state::<Databases>()
            .with(&viewer, |db| super::around(db, params))
    })
    .await?
}
