use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Clone, specta::Type)]
pub struct EmoteEntry {
    pub name: String,
    pub url: String,
}

#[derive(Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ChannelResult {
    pub emotes: Vec<EmoteEntry>,
    pub emote_set_id: Option<String>,
}

#[derive(Deserialize)]
pub(super) struct BttvEmote {
    id: String,
    code: String,
}

#[derive(Deserialize)]
pub(super) struct BttvChannelResponse {
    #[serde(rename = "channelEmotes", default)]
    pub(super) channel_emotes: Vec<BttvEmote>,
    #[serde(rename = "sharedEmotes", default)]
    pub(super) shared_emotes: Vec<BttvEmote>,
}

impl From<BttvEmote> for EmoteEntry {
    fn from(e: BttvEmote) -> Self {
        Self {
            url: format!("https://cdn.betterttv.net/emote/{}/1x", e.id),
            name: e.code,
        }
    }
}

#[derive(Deserialize)]
struct FfzEmote {
    id: u64,
    name: String,
}

#[derive(Deserialize)]
struct FfzSet {
    emoticons: Vec<FfzEmote>,
}

/// A missing room comes back as an error body with no sets: no emotes.
#[derive(Deserialize)]
pub(super) struct FfzResponse {
    #[serde(default)]
    sets: HashMap<String, FfzSet>,
}

impl From<FfzResponse> for Vec<EmoteEntry> {
    fn from(response: FfzResponse) -> Self {
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
}

#[derive(Deserialize)]
pub(super) struct StvEmote {
    id: String,
    pub(super) name: String,
}

#[derive(Deserialize)]
pub(super) struct StvGlobalResponse {
    pub(super) emotes: Vec<StvEmote>,
}

#[derive(Deserialize)]
struct StvEmoteSet {
    id: String,
    emotes: Vec<StvEmote>,
}

#[derive(Deserialize)]
pub(super) struct StvChannelResponse {
    emote_set: Option<StvEmoteSet>,
}

impl From<StvEmote> for EmoteEntry {
    fn from(e: StvEmote) -> Self {
        Self {
            url: format!("https://cdn.7tv.app/emote/{}/1x.webp", e.id),
            name: e.name,
        }
    }
}

impl From<StvChannelResponse> for ChannelResult {
    fn from(response: StvChannelResponse) -> Self {
        match response.emote_set {
            Some(set) => Self {
                emotes: set.emotes.into_iter().map(EmoteEntry::from).collect(),
                emote_set_id: Some(set.id),
            },
            None => Self {
                emotes: Vec::new(),
                emote_set_id: None,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{EmoteEntry, FfzResponse};

    #[test]
    fn missing_ffz_room_body_parses_as_no_emotes() {
        let response: FfzResponse =
            serde_json::from_str(r#"{"error":"Not Found","message":"No such room","status":404}"#)
                .unwrap();
        assert!(Vec::<EmoteEntry>::from(response).is_empty());
    }
}
