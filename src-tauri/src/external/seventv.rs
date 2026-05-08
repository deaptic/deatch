use super::EmoteEntry;
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

#[derive(serde::Serialize)]
pub struct SevenTvChannelResult {
    pub emotes: Vec<EmoteEntry>,
    pub emote_set_id: Option<String>,
}

fn to_entry(e: StvEmote) -> EmoteEntry {
    EmoteEntry {
        url: format!("https://cdn.7tv.app/emote/{}/1x.webp", e.id),
        name: e.name,
    }
}

#[tauri::command]
pub async fn seventv_get_global_emotes() -> Result<Vec<EmoteEntry>, String> {
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

#[tauri::command]
pub async fn seventv_get_channel_emotes(channel_id: String) -> Result<SevenTvChannelResult, String> {
    let response: StvChannelResponse = reqwest::Client::new()
        .get(format!("https://7tv.io/v3/users/twitch/{channel_id}"))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok(SevenTvChannelResult {
        emotes: response
            .emote_set
            .as_ref()
            .map(|s| s.emotes.iter().map(|e| EmoteEntry { name: e.name.clone(), url: format!("https://cdn.7tv.app/emote/{}/1x.webp", e.id) }).collect())
            .unwrap_or_default(),
        emote_set_id: response.emote_set.map(|s| s.id),
    })
}
