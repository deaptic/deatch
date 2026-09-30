use super::{ActivityInput, DiscordState};
use crate::error::Result;
use serde::Deserialize;
use tauri::State;

#[derive(Default, Deserialize, specta::Type)]
#[serde(default, rename_all = "camelCase")]
pub struct DiscordConnectParams {
    pub client_id: Option<String>,
}

#[tauri::command]
#[specta::specta]
pub async fn discord_connect(
    params: DiscordConnectParams,
    state: State<'_, DiscordState>,
) -> Result<()> {
    super::connect(state.inner(), params.client_id).await
}

#[tauri::command]
#[specta::specta]
pub async fn discord_disconnect(state: State<'_, DiscordState>) -> Result<()> {
    super::disconnect(state.inner()).await
}

#[tauri::command]
#[specta::specta]
pub async fn discord_set_activity(
    params: ActivityInput,
    state: State<'_, DiscordState>,
) -> Result<()> {
    super::set_activity(state.inner(), params).await
}

#[tauri::command]
#[specta::specta]
pub async fn discord_clear_activity(state: State<'_, DiscordState>) -> Result<()> {
    super::clear_activity(state.inner()).await
}
