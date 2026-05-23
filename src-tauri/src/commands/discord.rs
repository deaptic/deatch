use crate::services;
use crate::services::discord::{ActivityInput, DiscordState};
use tauri::State;

#[tauri::command]
pub async fn discord_connect(
    client_id: Option<String>,
    state: State<'_, DiscordState>,
) -> Result<(), String> {
    services::discord::connect(state.inner(), client_id).await
}

#[tauri::command]
pub async fn discord_disconnect(state: State<'_, DiscordState>) -> Result<(), String> {
    services::discord::disconnect(state.inner()).await
}

#[tauri::command]
pub async fn discord_set_activity(
    input: ActivityInput,
    state: State<'_, DiscordState>,
) -> Result<(), String> {
    services::discord::set_activity(state.inner(), input).await
}

#[tauri::command]
pub async fn discord_clear_activity(state: State<'_, DiscordState>) -> Result<(), String> {
    services::discord::clear_activity(state.inner()).await
}
