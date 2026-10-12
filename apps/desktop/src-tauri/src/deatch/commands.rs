use super::hub::{HubClient, Op};
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WatchParams {
    pub twitch_ids: Vec<String>,
}

#[tauri::command]
#[specta::specta]
pub fn deatch_connect(hub: State<HubClient>) {
    hub.request(Op::Connect);
}

#[tauri::command]
#[specta::specta]
pub fn deatch_disconnect(hub: State<HubClient>) {
    hub.request(Op::Disconnect);
}

#[tauri::command]
#[specta::specta]
pub fn deatch_watch(hub: State<HubClient>, params: WatchParams) {
    hub.request(Op::Watch(params.twitch_ids));
}
