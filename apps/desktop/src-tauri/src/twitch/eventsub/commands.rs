use super::ChannelFocus;
use crate::error::Result;
use crate::twitch::Twitch;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SetChannelsParams {
    pub channels: Vec<ChannelFocus>,
}

#[tauri::command]
#[specta::specta]
pub fn set_eventsub_channels(twitch: State<'_, Twitch>, params: SetChannelsParams) -> Result<()> {
    super::set_channels(&twitch, params.channels)
}
