use serde::{Deserialize, Deserializer, Serialize};
use std::collections::BTreeMap;

#[derive(Clone, Serialize, Deserialize, specta::Type)]
pub struct LinkChannel {
    pub login: String,
    #[serde(default)]
    pub muted: bool,
}

#[derive(Clone, Copy, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum LinkRewardStatus {
    Available,
    Paused,
    SoldOut,
}

#[derive(Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LinkReward {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub prompt: Option<String>,
    pub cost: u64,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub image: Option<String>,
    #[serde(default)]
    pub input: bool,
    pub status: LinkRewardStatus,
    #[serde(default)]
    pub cooldown_ends_at: Option<String>,
    #[serde(default)]
    pub per_user_limit: Option<u64>,
    #[serde(default)]
    pub redeemed_this_stream: Option<u64>,
    #[serde(default)]
    pub sub_only: bool,
}

#[derive(Clone, Serialize, Deserialize, specta::Type)]
pub struct LinkDrop {
    pub game: String,
    pub watched: u64,
    pub required: u64,
    #[serde(default)]
    pub reward: Option<String>,
    #[serde(default)]
    pub image: Option<String>,
}

#[derive(Clone, Default, Serialize, Deserialize, specta::Type, tauri_specta::Event)]
#[serde(rename_all = "camelCase")]
pub struct LinkState {
    pub channels: Vec<LinkChannel>,
    pub current: Option<String>,
    #[serde(default)]
    pub audio: bool,
    #[serde(default)]
    pub gains: Option<BTreeMap<String, f64>>,
    #[serde(default)]
    pub balances: Option<BTreeMap<String, u64>>,
    #[serde(default)]
    pub bonus_ready: Vec<String>,
    #[serde(default)]
    pub subscribed: Option<BTreeMap<String, bool>>,
    #[serde(default)]
    pub drops: Option<BTreeMap<String, LinkDrop>>,
    #[serde(default)]
    pub earned_at: Option<BTreeMap<String, String>>,
    #[serde(default)]
    pub compressor_on: Option<bool>,
    #[serde(default, deserialize_with = "known_rewards")]
    #[specta(type = Option<RewardsByChannel>)]
    pub rewards: Option<BTreeMap<String, Vec<LinkReward>>>,
}

type RewardsByChannel = BTreeMap<String, Vec<LinkReward>>;

fn known_rewards<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<Option<RewardsByChannel>, D::Error> {
    let raw = Option::<BTreeMap<String, Vec<serde_json::Value>>>::deserialize(deserializer)?;
    Ok(raw.map(|channels| {
        channels
            .into_iter()
            .map(|(login, rewards)| {
                let known = rewards
                    .into_iter()
                    .filter_map(|reward| serde_json::from_value(reward).ok())
                    .collect();
                (login, known)
            })
            .collect()
    }))
}

#[derive(Clone, Serialize, Deserialize, specta::Type, tauri_specta::Event)]
pub struct LinkAnswer {
    pub request: String,
    pub error: Option<String>,
}

#[derive(Clone, Serialize, specta::Type, tauri_specta::Event)]
pub struct LinkDisconnected;
