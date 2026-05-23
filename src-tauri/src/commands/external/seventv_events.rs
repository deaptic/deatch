use crate::services::external::seventv_events::SevenTvEvents;

#[tauri::command]
pub fn seventv_watch_emote_set(
    state: tauri::State<SevenTvEvents>,
    emote_set_id: Option<String>,
) {
    let _ = state.0.send(emote_set_id);
}
