use super::dto::{ChannelResult, EmoteEntry};
use super::seventv_events::{SevenTvEvents, SevenTvOp};
use super::{bttv, ffz, seventv};
use super::{BroadcasterLoginParams, EmoteSetParams};
use crate::error::Result;
use crate::twitch::params::BroadcasterParams;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn bttv_get_global_emotes(http: State<'_, reqwest::Client>) -> Result<Vec<EmoteEntry>> {
    bttv::get_global_emotes(&http).await
}

#[tauri::command]
#[specta::specta]
pub async fn bttv_get_channel_emotes(
    http: State<'_, reqwest::Client>,
    params: BroadcasterParams,
) -> Result<Vec<EmoteEntry>> {
    bttv::get_channel_emotes(&http, params.broadcaster_id).await
}

#[tauri::command]
#[specta::specta]
pub async fn ffz_get_global_emotes(http: State<'_, reqwest::Client>) -> Result<Vec<EmoteEntry>> {
    ffz::get_global_emotes(&http).await
}

#[tauri::command]
#[specta::specta]
pub async fn ffz_get_channel_emotes(
    http: State<'_, reqwest::Client>,
    params: BroadcasterLoginParams,
) -> Result<Vec<EmoteEntry>> {
    ffz::get_channel_emotes(&http, params.broadcaster_login).await
}

#[tauri::command]
#[specta::specta]
pub async fn seventv_get_global_emotes(
    http: State<'_, reqwest::Client>,
) -> Result<Vec<EmoteEntry>> {
    seventv::get_global_emotes(&http).await
}

#[tauri::command]
#[specta::specta]
pub async fn seventv_get_channel_emotes(
    http: State<'_, reqwest::Client>,
    params: BroadcasterParams,
) -> Result<ChannelResult> {
    seventv::get_channel_emotes(&http, params.broadcaster_id).await
}

#[tauri::command]
#[specta::specta]
pub fn seventv_subscribe_emote_set(
    state: State<SevenTvEvents>,
    params: EmoteSetParams,
) -> Result<()> {
    state.request(SevenTvOp::Subscribe(params.emote_set_id))
}

#[tauri::command]
#[specta::specta]
pub fn seventv_unsubscribe_emote_set(
    state: State<SevenTvEvents>,
    params: EmoteSetParams,
) -> Result<()> {
    state.request(SevenTvOp::Unsubscribe(params.emote_set_id))
}
