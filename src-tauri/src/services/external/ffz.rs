use crate::dto::external::emote::EmoteEntry;
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Deserialize)]
struct FfzEmote {
    id: u64,
    name: String,
}

#[derive(Deserialize)]
struct FfzSet {
    emoticons: Vec<FfzEmote>,
}

#[derive(Deserialize)]
struct FfzResponse {
    sets: HashMap<String, FfzSet>,
}

fn response_to_entries(response: FfzResponse) -> Vec<EmoteEntry> {
    response
        .sets
        .into_values()
        .flat_map(|s| s.emoticons)
        .map(|e| EmoteEntry {
            name: e.name,
            url: format!("https://cdn.frankerfacez.com/emote/{}/1", e.id),
        })
        .collect()
}

pub async fn get_global_emotes() -> Result<Vec<EmoteEntry>, String> {
    let response: FfzResponse = reqwest::Client::new()
        .get("https://api.frankerfacez.com/v1/set/global")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(response_to_entries(response))
}

pub async fn get_channel_emotes(channel_login: String) -> Result<Vec<EmoteEntry>, String> {
    let response: FfzResponse = reqwest::Client::new()
        .get(format!(
            "https://api.frankerfacez.com/v1/room/{channel_login}"
        ))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(response_to_entries(response))
}
