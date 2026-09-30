use super::EventKind;
use crate::error::Result;
use crate::twitch::Twitch;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SubscribeParams {
    pub broadcaster_id: String,
    pub kind: EventKind,
}

#[tauri::command]
#[specta::specta]
pub async fn subscribe(
    app: tauri::AppHandle,
    twitch: State<'_, Twitch>,
    params: SubscribeParams,
) -> Result<()> {
    super::subscribe(&app, &twitch, params.broadcaster_id, params.kind).await
}

#[tauri::command]
#[specta::specta]
pub fn unsubscribe(twitch: State<'_, Twitch>, params: SubscribeParams) -> Result<()> {
    super::unsubscribe(&twitch, params.broadcaster_id, params.kind)
}
