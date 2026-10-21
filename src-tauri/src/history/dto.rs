use crate::twitch::ids::{MessageId, UserId};
use serde::Serialize;

#[derive(Default, Serialize, specta::Type)]
pub struct RecentHistory {
    pub messages: Vec<RecentMessage>,
    pub notices: Vec<RecentNotice>,
}

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

/// A USERNOTICE in the shape of EventSub's `channel.chat.notification`, so
/// the renderer reads history and live notices alike. Only the detail that
/// matches `notice_type` is set.
#[derive(Serialize, specta::Type)]
pub struct RecentNotice {
    pub broadcaster_user_id: UserId,
    pub message_id: MessageId,
    pub notice_type: String,
    pub system_message: String,
    pub chatter_is_anonymous: bool,
    pub chatter_user_id: UserId,
    pub chatter_user_login: String,
    pub chatter_user_name: String,
    pub color: String,
    pub message: MessageBody,
    pub timestamp_ms: i64,
    pub sub: Option<SubNotice>,
    pub resub: Option<ResubNotice>,
    pub sub_gift: Option<SubGiftNotice>,
    pub community_sub_gift: Option<CommunitySubGiftNotice>,
    pub gift_paid_upgrade: Option<GifterNotice>,
    pub prime_paid_upgrade: Option<PrimePaidUpgradeNotice>,
    pub pay_it_forward: Option<GifterNotice>,
    pub raid: Option<RaidNotice>,
    pub bits_badge_tier: Option<BitsBadgeTierNotice>,
    pub charity_donation: Option<CharityDonationNotice>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, specta::Type)]
pub enum SubTier {
    #[serde(rename = "1000")]
    Tier1,
    #[serde(rename = "2000")]
    Tier2,
    #[serde(rename = "3000")]
    Tier3,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
pub struct SubNotice {
    pub sub_tier: SubTier,
    pub is_prime: bool,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
pub struct ResubNotice {
    pub sub_tier: SubTier,
    pub is_prime: bool,
    pub cumulative_months: u32,
    pub streak_months: Option<u32>,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
pub struct SubGiftNotice {
    pub sub_tier: SubTier,
    pub recipient_user_name: String,
    pub cumulative_total: Option<u32>,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
pub struct CommunitySubGiftNotice {
    pub sub_tier: SubTier,
    pub total: u32,
    pub cumulative_total: Option<u32>,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
pub struct GifterNotice {
    pub gifter_is_anonymous: bool,
    pub gifter_user_name: Option<String>,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
pub struct PrimePaidUpgradeNotice {
    pub sub_tier: SubTier,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
pub struct RaidNotice {
    pub user_name: String,
    pub viewer_count: u32,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
pub struct BitsBadgeTierNotice {
    pub tier: u32,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
pub struct CharityDonationNotice {
    pub charity_name: String,
    pub amount: CharityAmount,
}

#[derive(Debug, PartialEq, Serialize, specta::Type)]
pub struct CharityAmount {
    pub value: u64,
    pub decimal_place: u32,
    pub currency: String,
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
