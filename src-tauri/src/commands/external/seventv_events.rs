use crate::services::external::seventv_events::{SevenTvEvents, SevenTvOp};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SeventvEmoteSetParams {
    pub emote_set_id: String,
}

#[tauri::command]
pub fn seventv_subscribe_emote_set(
    state: tauri::State<SevenTvEvents>,
    params: SeventvEmoteSetParams,
) {
    let _ = state.0.send(SevenTvOp::Subscribe(params.emote_set_id));
}

#[tauri::command]
pub fn seventv_unsubscribe_emote_set(
    state: tauri::State<SevenTvEvents>,
    params: SeventvEmoteSetParams,
) {
    let _ = state.0.send(SevenTvOp::Unsubscribe(params.emote_set_id));
}
