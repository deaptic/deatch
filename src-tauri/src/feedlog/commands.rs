use super::{AppendParams, AroundParams, FeedLog, PageParams};
use crate::blocking;
use crate::error::Result;
use crate::twitch::Twitch;
use tauri::{Manager, State};

// Each call reads and writes the signed-in account's own log.

#[tauri::command]
#[specta::specta]
pub async fn feedlog_append(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: AppendParams,
) -> Result<()> {
    let viewer = twitch.viewer().await?;
    blocking::run(app, move |app| {
        app.state::<FeedLog>().append(&viewer, params)
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
    blocking::run(app, move |app| app.state::<FeedLog>().page(&viewer, params)).await?
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
        app.state::<FeedLog>().around(&viewer, params)
    })
    .await?
}
