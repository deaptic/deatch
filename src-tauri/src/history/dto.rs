use serde::Serialize;

#[derive(Serialize, specta::Type)]
pub struct RecentMessage {
    pub broadcaster_user_id: String,
    pub message_id: String,
    pub chatter_user_id: String,
    pub chatter_user_login: String,
    pub chatter_user_name: String,
    pub color: String,
    pub message: MessageBody,
    pub message_type: String,
    pub badges: Vec<ChatterBadge>,
    pub reply: Option<Reply>,
    pub channel_points_custom_reward_id: Option<String>,
    pub timestamp_ms: i64,
    pub deleted: bool,
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
    pub parent_message_id: String,
    pub parent_message_body: String,
    pub parent_user_name: String,
    pub parent_user_login: String,
    pub parent_user_id: String,
}
