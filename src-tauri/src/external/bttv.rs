use super::EmoteEntry;
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

#[tauri::command]
pub async fn bttv_get_global_emotes() -> Result<Vec<EmoteEntry>, String> {
    let emotes: Vec<BttvEmote> = reqwest::Client::new()
        .get("https://api.betterttv.net/3/cached/emotes/global")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok(emotes.into_iter().map(to_entry).collect())
}

#[tauri::command]
pub async fn bttv_get_channel_emotes(channel_id: String) -> Result<Vec<EmoteEntry>, String> {
    let response: BttvChannelResponse = reqwest::Client::new()
        .get(format!("https://api.betterttv.net/3/cached/users/twitch/{channel_id}"))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok(response
        .channel_emotes
        .into_iter()
        .chain(response.shared_emotes)
        .map(to_entry)
        .collect())
}
