use crate::emotes::dto::EmoteEntry;
use crate::error::Result;
use crate::http::get_json;
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
    #[serde(default)]
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

pub async fn get_global_emotes(http: &reqwest::Client) -> Result<Vec<EmoteEntry>> {
    let response: FfzResponse =
        get_json(http, "https://api.frankerfacez.com/v1/set/global").await?;
    Ok(response_to_entries(response))
}

pub async fn get_channel_emotes(
    http: &reqwest::Client,
    channel_login: String,
) -> Result<Vec<EmoteEntry>> {
    let response: FfzResponse = get_json(
        http,
        &format!("https://api.frankerfacez.com/v1/room/{channel_login}"),
    )
    .await?;
    Ok(response_to_entries(response))
}

#[cfg(test)]
mod tests {
    use super::{response_to_entries, FfzResponse};

    #[test]
    fn missing_room_body_parses_as_no_emotes() {
        let response: FfzResponse =
            serde_json::from_str(r#"{"error":"Not Found","message":"No such room","status":404}"#)
                .unwrap();
        assert!(response_to_entries(response).is_empty());
    }
}
