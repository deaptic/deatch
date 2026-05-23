use crate::services;
use crate::services::discord::{ActivityInput, DiscordState};
use serde::Deserialize;
use tauri::State;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct DiscordConnectParams {
    pub client_id: Option<String>,
}

#[tauri::command]
pub async fn discord_connect(
    params: DiscordConnectParams,
    state: State<'_, DiscordState>,
) -> Result<(), String> {
    services::discord::connect(state.inner(), params.client_id).await
}

#[tauri::command]
pub async fn discord_disconnect(state: State<'_, DiscordState>) -> Result<(), String> {
    services::discord::disconnect(state.inner()).await
}

#[tauri::command]
pub async fn discord_set_activity(
    params: ActivityInput,
    state: State<'_, DiscordState>,
) -> Result<(), String> {
    services::discord::set_activity(state.inner(), params).await
}

#[tauri::command]
pub async fn discord_clear_activity(state: State<'_, DiscordState>) -> Result<(), String> {
    services::discord::clear_activity(state.inner()).await
}
