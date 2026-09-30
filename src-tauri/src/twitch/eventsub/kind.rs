#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
pub enum EventKind {
    #[serde(rename = "channel.chat.message")]
    ChannelChatMessage,
    #[serde(rename = "channel.chat.notification")]
    ChannelChatNotification,
    #[serde(rename = "channel.chat.message_delete")]
    ChannelChatMessageDelete,
    #[serde(rename = "channel.chat.clear")]
    ChannelChatClear,
    #[serde(rename = "channel.chat.clear_user_messages")]
    ChannelChatClearUserMessages,
    #[serde(rename = "channel.shoutout.create")]
    ChannelShoutoutCreate,
    #[serde(rename = "channel.follow")]
    ChannelFollow,
    #[serde(rename = "channel.moderate")]
    ChannelModerate,
    #[serde(rename = "automod.message.hold")]
    AutomodMessageHold,
    #[serde(rename = "automod.message.update")]
    AutomodMessageUpdate,
    #[serde(rename = "channel.channel_points_custom_reward_redemption.add")]
    ChannelPointsCustomRewardRedemptionAdd,
}

impl EventKind {
    pub(super) fn requires_mod(self) -> bool {
        matches!(
            self,
            Self::ChannelShoutoutCreate
                | Self::ChannelFollow
                | Self::ChannelModerate
                | Self::AutomodMessageHold
                | Self::AutomodMessageUpdate
        )
    }
}
