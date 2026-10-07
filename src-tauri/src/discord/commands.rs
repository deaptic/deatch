use super::{ActivityInput, DiscordState};
use crate::error::Result;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn discord_connect(state: State<'_, DiscordState>) -> Result<()> {
    super::connect(&state)
}

#[tauri::command]
#[specta::specta]
pub async fn discord_disconnect(state: State<'_, DiscordState>) -> Result<()> {
    super::disconnect(&state)
}

#[tauri::command]
#[specta::specta]
pub async fn discord_set_activity(
    state: State<'_, DiscordState>,
    params: ActivityInput,
) -> Result<()> {
    super::set_activity(&state, params)
}
