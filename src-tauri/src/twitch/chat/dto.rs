use crate::twitch::ids::UserId;
use serde::Serialize;
use twitch_api::helix::chat::{
    send_chat_message::{ChatMessageDropCode, SendChatMessageResponse},
    BadgeSet as HelixBadgeSet, ChatBadge as HelixChatBadge, ChatSettings as HelixChatSettings,
    GlobalEmote, UserEmote as HelixUserEmote,
};

fn emote_url(id: &str) -> String {
    format!("https://static-cdn.jtvnw.net/emoticons/v2/{id}/default/dark/1.0")
}

#[derive(Debug, Clone, Serialize, specta::Type)]
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

#[derive(Debug, Clone, Serialize, specta::Type)]
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

#[derive(Debug, Clone, Serialize, specta::Type)]
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

#[derive(Debug, Clone, Serialize, specta::Type)]
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

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SendMessageResult {
    pub message_id: Option<String>,
    pub is_sent: bool,
    /// AutoMod is holding the message for a moderator to approve or deny.
    pub held: bool,
    pub drop_reason: Option<String>,
}

impl From<SendChatMessageResponse> for SendMessageResult {
    fn from(r: SendChatMessageResponse) -> Self {
        let held = r
            .drop_reason
            .as_ref()
            .is_some_and(|d| matches!(d.code, ChatMessageDropCode::MsgRejected));
        Self {
            message_id: r.message_id.map(|m| m.to_string()),
            is_sent: r.is_sent,
            held,
            drop_reason: r.drop_reason.map(|d| d.message),
        }
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ChatSettings {
    pub slow_mode_seconds: Option<u64>,
    pub follower_mode_minutes: Option<u64>,
    pub subscriber_mode: bool,
    pub emote_mode: bool,
    pub unique_chat_mode: bool,
}

impl From<HelixChatSettings> for ChatSettings {
    fn from(s: HelixChatSettings) -> Self {
        Self {
            slow_mode_seconds: s.slow_mode.then(|| s.slow_mode_wait_time.unwrap_or(0)),
            follower_mode_minutes: s
                .follower_mode
                .then(|| s.follower_mode_duration.unwrap_or(0)),
            subscriber_mode: s.subscriber_mode,
            emote_mode: s.emote_mode,
            unique_chat_mode: s.unique_chat_mode,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::ChatSettings;
    use serde_json::json;

    fn helix_settings(value: serde_json::Value) -> ChatSettings {
        ChatSettings::from(serde_json::from_value::<super::HelixChatSettings>(value).unwrap())
    }

    #[test]
    fn modes_carry_their_durations() {
        let settings = helix_settings(json!({
            "broadcaster_id": "1",
            "emote_mode": true,
            "follower_mode": true,
            "follower_mode_duration": 0,
            "slow_mode": true,
            "slow_mode_wait_time": 30,
            "subscriber_mode": false,
            "unique_chat_mode": false
        }));
        assert_eq!(
            serde_json::to_value(settings).unwrap(),
            json!({
                "slowModeSeconds": 30,
                "followerModeMinutes": 0,
                "subscriberMode": false,
                "emoteMode": true,
                "uniqueChatMode": false
            })
        );
    }

    #[test]
    fn disabled_modes_drop_their_durations() {
        let settings = helix_settings(json!({
            "broadcaster_id": "1",
            "emote_mode": false,
            "follower_mode": false,
            "follower_mode_duration": null,
            "slow_mode": false,
            "slow_mode_wait_time": null,
            "subscriber_mode": true,
            "unique_chat_mode": true
        }));
        let value = serde_json::to_value(settings).unwrap();
        assert_eq!(value["slowModeSeconds"], json!(null));
        assert_eq!(value["followerModeMinutes"], json!(null));
        assert_eq!(value["subscriberMode"], json!(true));
    }
}
