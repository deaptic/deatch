mod bttv;
pub mod commands;
pub mod dto;
pub mod events;
mod ffz;
mod seventv;
pub mod seventv_events;

use crate::twitch::ids::SevenTvEmoteSetId;
use serde::Deserialize;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BroadcasterLoginParams {
    pub broadcaster_login: String,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmoteSetParams {
    pub emote_set_id: SevenTvEmoteSetId,
}
