use crate::dto::external::emote::EmoteEntry;
use crate::dto::external::seventv::ChannelResult;
use serde::Deserialize;

#[derive(Deserialize)]
struct StvEmote {
    id: String,
    name: String,
}

#[derive(Deserialize)]
struct StvGlobalResponse {
    emotes: Vec<StvEmote>,
}

#[derive(Deserialize)]
struct StvEmoteSet {
    id: String,
    emotes: Vec<StvEmote>,
}

#[derive(Deserialize)]
struct StvChannelResponse {
    emote_set: Option<StvEmoteSet>,
}

pub fn emote_url(id: &str) -> String {
    format!("https://cdn.7tv.app/emote/{id}/1x.webp")
}

fn to_entry(e: StvEmote) -> EmoteEntry {
    EmoteEntry {
        url: emote_url(&e.id),
        name: e.name,
    }
}

pub async fn get_global_emotes() -> Result<Vec<EmoteEntry>, String> {
    let response: StvGlobalResponse = reqwest::Client::new()
        .get("https://7tv.io/v3/emote-sets/global")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(response.emotes.into_iter().map(to_entry).collect())
}

pub async fn get_channel_emotes(channel_id: String) -> Result<ChannelResult, String> {
    let response: StvChannelResponse = reqwest::Client::new()
        .get(format!("https://7tv.io/v3/users/twitch/{channel_id}"))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let (emotes, emote_set_id) = match response.emote_set {
        Some(s) => (s.emotes.into_iter().map(to_entry).collect(), Some(s.id)),
        None => (Vec::new(), None),
    };
    Ok(ChannelResult {
        emotes,
        emote_set_id,
    })
}
