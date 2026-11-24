use super::dto::Whisper;
use crate::platform::db;
use crate::platform::error::Result;
use crate::twitch::whispers::{
    self, MarkWhispersReadParams, SaveWhispersParams, SendWhisperParams,
};
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn send_whisper(twitch: State<'_, Twitch>, params: SendWhisperParams) -> Result<()> {
    whispers::send(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn whispers_save(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: SaveWhispersParams,
) -> Result<()> {
    db::run(app, twitch.viewer().await?, |db| whispers::save(db, params)).await
}

#[tauri::command]
#[specta::specta]
pub async fn whispers_list(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
) -> Result<Vec<Whisper>> {
    db::run(app, twitch.viewer().await?, |db| whispers::list(db)).await
}

#[tauri::command]
#[specta::specta]
pub async fn whispers_mark_read(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: MarkWhispersReadParams,
) -> Result<()> {
    db::run(app, twitch.viewer().await?, |db| {
        whispers::mark_read(db, params)
    })
    .await
}
