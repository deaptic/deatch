use crate::services::external::seventv_events::SevenTvEvents;
use serde::Deserialize;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct SeventvWatchEmoteSetParams {
    pub emote_set_id: Option<String>,
}

#[tauri::command]
pub fn seventv_watch_emote_set(
    state: tauri::State<SevenTvEvents>,
    params: SeventvWatchEmoteSetParams,
) {
    let _ = state.0.send(params.emote_set_id);
}
