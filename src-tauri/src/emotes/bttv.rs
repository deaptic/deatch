use crate::emotes::dto::EmoteEntry;
use crate::error::Result;
use crate::http::get_json;
use serde::Deserialize;

#[derive(Deserialize)]
struct BttvEmote {
    id: String,
    code: String,
}

#[derive(Deserialize)]
struct BttvChannelResponse {
    #[serde(rename = "channelEmotes", default)]
    channel_emotes: Vec<BttvEmote>,
    #[serde(rename = "sharedEmotes", default)]
    shared_emotes: Vec<BttvEmote>,
}

fn to_entry(e: BttvEmote) -> EmoteEntry {
    EmoteEntry {
        url: format!("https://cdn.betterttv.net/emote/{}/1x", e.id),
        name: e.code,
    }
}

pub async fn get_global_emotes(http: &reqwest::Client) -> Result<Vec<EmoteEntry>> {
    let emotes: Vec<BttvEmote> =
        get_json(http, "https://api.betterttv.net/3/cached/emotes/global").await?;
    Ok(emotes.into_iter().map(to_entry).collect())
}

pub async fn get_channel_emotes(
    http: &reqwest::Client,
    channel_id: String,
) -> Result<Vec<EmoteEntry>> {
    let response: BttvChannelResponse = get_json(
        http,
        &format!("https://api.betterttv.net/3/cached/users/twitch/{channel_id}"),
    )
    .await?;
    Ok(response
        .channel_emotes
        .into_iter()
        .chain(response.shared_emotes)
        .map(to_entry)
        .collect())
}
