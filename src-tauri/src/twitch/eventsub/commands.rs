use super::SetChannelsParams;
use crate::error::Result;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub fn set_eventsub_channels(twitch: State<'_, Twitch>, params: SetChannelsParams) -> Result<()> {
    super::set_channels(&twitch, params)
}
