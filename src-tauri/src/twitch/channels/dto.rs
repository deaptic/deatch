use crate::twitch::client::game::GameRef;
use crate::twitch::users::dto::UserRef;
use serde::Serialize;
use twitch_api::helix::ccls::ContentClassificationLabel as HelixContentLabel;
use twitch_api::helix::channels::{ChannelInformation, Follower as HelixFollower};
use twitch_api::types::ContentClassificationId;

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ChannelInfo {
    pub broadcaster: UserRef,
    pub game: GameRef,
    pub title: String,
}

impl From<ChannelInformation> for ChannelInfo {
    fn from(c: ChannelInformation) -> Self {
        Self {
            broadcaster: UserRef::new(c.broadcaster_id, c.broadcaster_login, c.broadcaster_name),
            game: GameRef::new(c.game_id, c.game_name),
            title: c.title,
        }
    }
}

fn label_id(id: &ContentClassificationId) -> String {
    serde_json::to_value(id)
        .ok()
        .and_then(|v| v.as_str().map(str::to_string))
        .unwrap_or_default()
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ChannelDetails {
    pub tags: Vec<String>,
    pub content_labels: Vec<String>,
    pub branded_content: bool,
}

impl From<ChannelInformation> for ChannelDetails {
    fn from(c: ChannelInformation) -> Self {
        Self {
            tags: c.tags,
            content_labels: c
                .content_classification_labels
                .iter()
                .map(label_id)
                .collect(),
            branded_content: c.is_branded_content,
        }
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ContentLabel {
    pub id: String,
    pub name: String,
    pub description: String,
}

impl From<HelixContentLabel> for ContentLabel {
    fn from(l: HelixContentLabel) -> Self {
        Self {
            id: label_id(&l.id),
            name: l.name,
            description: l.description,
        }
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Follower {
    pub user: UserRef,
    pub followed_at: String,
}

impl From<HelixFollower> for Follower {
    fn from(f: HelixFollower) -> Self {
        Self {
            user: UserRef::new(f.user_id, f.user_login, f.user_name),
            followed_at: f.followed_at.to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FollowersPage {
    pub followers: Vec<Follower>,
    pub total: Option<u32>,
    pub cursor: Option<String>,
}
