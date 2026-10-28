use crate::twitch::ids::{MessageId, UserId};
use serde::Serialize;
use twitch_api::helix::chat::{
    send_chat_message::{ChatMessageDropCode, ChatMessageDropReason, SendChatMessageResponse},
    BadgeSet as HelixBadgeSet, ChatBadge as HelixChatBadge, ChatSettings as HelixChatSettings,
    GlobalEmote, UserEmote as HelixUserEmote,
};

fn emote_url(id: &twitch_api::types::EmoteIdRef) -> String {
    id.url().size_1x().dark_mode().render()
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
            url: emote_url(&e.id),
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
            url: emote_url(&e.id),
            id: e.id.to_string(),
            name: e.name,
            emote_type: e.emote_type,
            emote_set_id: e.emote_set_id.to_string(),
            owner_id: UserId::from(e.owner_id.to_string()),
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
    pub message_id: Option<MessageId>,
    pub is_sent: bool,
    pub drop_reason: Option<DropReason>,
}

/// Why Twitch refused a message; the frontend owns the wording. Unknown codes
/// keep Twitch's own text so nothing is lost.
#[derive(Debug, Clone, PartialEq, Serialize, specta::Type)]
#[serde(tag = "code", content = "message", rename_all = "camelCase")]
pub enum DropReason {
    /// AutoMod is holding the message for a moderator to approve or deny.
    Held,
    Rejected,
    Banned,
    TimedOut,
    Suspended,
    ChannelBlocked,
    ChannelSuspended,
    BadCharacters,
    Duplicate,
    UniqueChat,
    RateLimit,
    SlowMode,
    EmoteOnly,
    FollowersOnly,
    SubscribersOnly,
    PhoneRequired,
    EmailRequired,
    Unknown(String),
}

impl From<ChatMessageDropReason> for DropReason {
    fn from(d: ChatMessageDropReason) -> Self {
        use ChatMessageDropCode as Code;
        match d.code {
            Code::MsgRejected => Self::Held,
            Code::MsgRejectedMandatory => Self::Rejected,
            Code::MsgBanned => Self::Banned,
            Code::MsgTimedout => Self::TimedOut,
            Code::MsgSuspended => Self::Suspended,
            Code::MsgChannelBlocked => Self::ChannelBlocked,
            Code::MsgChannelSuspended => Self::ChannelSuspended,
            Code::MsgBadCharacters => Self::BadCharacters,
            Code::MsgDuplicate => Self::Duplicate,
            Code::MsgR9k => Self::UniqueChat,
            Code::MsgRatelimit => Self::RateLimit,
            Code::MsgSlowmode => Self::SlowMode,
            Code::MsgEmoteonly => Self::EmoteOnly,
            Code::MsgFollowersonly
            | Code::MsgFollowersonlyFollowed
            | Code::MsgFollowersonlyZero => Self::FollowersOnly,
            Code::MsgSubsonly => Self::SubscribersOnly,
            Code::MsgRequiresVerifiedPhoneNumber => Self::PhoneRequired,
            Code::MsgVerifiedEmail => Self::EmailRequired,
            _ => Self::Unknown(d.message),
        }
    }
}

impl From<SendChatMessageResponse> for SendMessageResult {
    fn from(r: SendChatMessageResponse) -> Self {
        Self {
            message_id: r.message_id.map(|m| MessageId::from(m.to_string())),
            is_sent: r.is_sent,
            drop_reason: r.drop_reason.map(DropReason::from),
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
    use super::{emote_url, ChatSettings, DropReason, SendMessageResult};
    use serde_json::json;

    // The frontend's Ctrl-zoom and inline emotes expect this exact shape.
    #[test]
    fn emote_url_is_the_small_dark_cdn_image() {
        let id = twitch_api::types::EmoteId::new("25".into());
        assert_eq!(
            emote_url(&id),
            "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0"
        );
    }

    fn sent(value: serde_json::Value) -> SendMessageResult {
        SendMessageResult::from(
            serde_json::from_value::<super::SendChatMessageResponse>(value).unwrap(),
        )
    }

    fn dropped(code: &str, message: &str) -> Option<DropReason> {
        sent(json!({
            "message_id": "",
            "is_sent": false,
            "drop_reason": { "code": code, "message": message }
        }))
        .drop_reason
    }

    #[test]
    fn maps_drop_codes_to_reasons() {
        assert_eq!(dropped("msg_rejected", "held"), Some(DropReason::Held));
        assert_eq!(
            dropped("msg_followersonly_zero", "follow"),
            Some(DropReason::FollowersOnly)
        );
    }

    #[test]
    fn keeps_twitch_text_for_unknown_codes() {
        assert_eq!(
            dropped("msg_brand_new", "something new"),
            Some(DropReason::Unknown("something new".into()))
        );
    }

    #[test]
    fn serializes_as_code_and_message() {
        assert_eq!(
            serde_json::to_value(DropReason::SlowMode).unwrap(),
            json!({ "code": "slowMode" })
        );
        assert_eq!(
            serde_json::to_value(DropReason::Unknown("x".into())).unwrap(),
            json!({ "code": "unknown", "message": "x" })
        );
    }

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
