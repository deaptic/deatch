use super::dto::{Clip, CreatedClip};
use crate::platform::error::Result;
use crate::twitch::clips::{self, CreateClipParams, TopClipsParams};
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

#[tauri::command]
#[specta::specta]
pub async fn get_top_clips(twitch: State<'_, Twitch>, params: TopClipsParams) -> Result<Vec<Clip>> {
    clips::top_clips(&twitch.authed().await?, params).await
}
