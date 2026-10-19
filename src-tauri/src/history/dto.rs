use crate::twitch::ids::{MessageId, UserId};
use serde::Serialize;

#[derive(Serialize, specta::Type)]
pub struct RecentMessage {
    pub broadcaster_user_id: UserId,
    pub message_id: MessageId,
    pub chatter_user_id: UserId,
    pub chatter_user_login: String,
    pub chatter_user_name: String,
    pub color: String,
    pub message: MessageBody,
    pub message_type: MessageType,
    pub badges: Vec<ChatterBadge>,
    pub reply: Option<Reply>,
    pub channel_points_custom_reward_id: Option<String>,
    pub timestamp_ms: i64,
    pub deleted: bool,
    /// Set only for shared chat messages sent in a partner channel, like
    /// EventSub's `source_*` fields; IRC carries no login or name for it.
    pub source_broadcaster_user_id: Option<UserId>,
    pub source_message_id: Option<MessageId>,
    pub source_badges: Option<Vec<ChatterBadge>>,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum MessageType {
    Text,
    UserIntro,
}

#[derive(Serialize, specta::Type)]
pub struct MessageBody {
    pub text: String,
    pub fragments: Vec<MessageFragment>,
}

#[derive(Serialize, specta::Type)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MessageFragment {
    Text { text: String },
    Emote { text: String, emote: EmoteRef },
    Mention { text: String, mention: MentionRef },
}

#[derive(Serialize, specta::Type)]
pub struct EmoteRef {
    pub id: String,
}

#[derive(Serialize, specta::Type)]
pub struct MentionRef {
    pub user_login: String,
}

#[derive(Serialize, specta::Type)]
pub struct ChatterBadge {
    pub set_id: String,
    pub id: String,
    pub info: String,
}

#[derive(Serialize, specta::Type)]
pub struct Reply {
    pub parent_message_id: MessageId,
    pub parent_message_body: String,
    pub parent_user_name: String,
    pub parent_user_login: String,
    pub parent_user_id: UserId,
}
