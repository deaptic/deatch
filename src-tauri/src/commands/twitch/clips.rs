use crate::dto::twitch::clip::CreatedClip;
use crate::error::Result;
use crate::services::twitch::clips::{self, CreateClipParams};
use crate::services::twitch::Twitch;
use tauri::State;

#[tauri::command]
pub async fn create_clip(
    twitch: State<'_, Twitch>,
    params: CreateClipParams,
) -> Result<CreatedClip> {
    clips::create_clip(&twitch.authed().await?, params).await
}
