use super::dto::CreatedClip;
use crate::error::Result;
use crate::twitch::clips::{self, CreateClipParams};
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn create_clip(
    twitch: State<'_, Twitch>,
    params: CreateClipParams,
) -> Result<CreatedClip> {
    clips::create_clip(&twitch.authed().await?, params).await
}
