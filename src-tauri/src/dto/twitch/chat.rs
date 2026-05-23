use super::ids::UserId;
use serde::Serialize;
use twitch_api::helix::chat::{
    send_chat_message::SendChatMessageResponse, BadgeSet as HelixBadgeSet,
    ChatBadge as HelixChatBadge, GlobalEmote, UserEmote as HelixUserEmote,
};

fn emote_url(id: &str) -> String {
    format!("https://static-cdn.jtvnw.net/emoticons/v2/{id}/default/dark/1.0")
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Emote {
    pub id: String,
    pub name: String,
    pub url: String,
}

impl From<GlobalEmote> for Emote {
    fn from(e: GlobalEmote) -> Self {
        Self {
            url: emote_url(e.id.as_str()),
            id: e.id.to_string(),
            name: e.name,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserEmote {
    pub id: String,
    pub name: String,
    pub url: String,
    pub emote_type: String,
    pub emote_set_id: String,
    pub owner_id: UserId,
}

impl From<HelixUserEmote> for UserEmote {
    fn from(e: HelixUserEmote) -> Self {
        Self {
            url: emote_url(e.id.as_str()),
            id: e.id.to_string(),
            name: e.name,
            emote_type: e.emote_type,
            emote_set_id: e.emote_set_id.to_string(),
            owner_id: UserId(e.owner_id.to_string()),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Badge {
    pub id: String,
    pub url_1x: String,
    pub url_2x: String,
    pub url_4x: String,
    pub title: String,
    pub description: String,
}

impl From<HelixChatBadge> for Badge {
    fn from(b: HelixChatBadge) -> Self {
        Self {
            id: b.id.to_string(),
            url_1x: b.image_url_1x,
            url_2x: b.image_url_2x,
            url_4x: b.image_url_4x,
            title: b.title,
            description: b.description,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BadgeSet {
    pub set_id: String,
    pub versions: Vec<Badge>,
}

impl From<HelixBadgeSet> for BadgeSet {
    fn from(b: HelixBadgeSet) -> Self {
        Self {
            set_id: b.set_id.to_string(),
            versions: b.versions.into_iter().map(Badge::from).collect(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SendMessageResult {
    pub message_id: Option<String>,
    pub is_sent: bool,
    pub drop_reason: Option<String>,
}

impl From<SendChatMessageResponse> for SendMessageResult {
    fn from(r: SendChatMessageResponse) -> Self {
        Self {
            message_id: r.message_id.map(|m| m.to_string()),
            is_sent: r.is_sent,
            drop_reason: r.drop_reason.map(|d| d.message),
        }
    }
}
