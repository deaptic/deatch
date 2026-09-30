use std::collections::BTreeMap;

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    serde::Serialize,
    serde::Deserialize,
    specta::Type,
)]
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
    /// Ordered by subscription priority: chat kinds first so every channel's
    /// chat comes up before anything else on (re)connect.
    pub const ALL: [Self; 11] = [
        Self::ChannelChatMessage,
        Self::ChannelChatNotification,
        Self::ChannelChatMessageDelete,
        Self::ChannelChatClear,
        Self::ChannelChatClearUserMessages,
        Self::ChannelShoutoutCreate,
        Self::ChannelFollow,
        Self::ChannelModerate,
        Self::AutomodMessageHold,
        Self::AutomodMessageUpdate,
        Self::ChannelPointsCustomRewardRedemptionAdd,
    ];

    pub fn event_name(self) -> &'static str {
        match self {
            Self::ChannelChatMessage => "channel-chat-message",
            Self::ChannelChatNotification => "channel-chat-notification",
            Self::ChannelChatMessageDelete => "channel-chat-message-delete",
            Self::ChannelChatClear => "channel-chat-clear",
            Self::ChannelChatClearUserMessages => "channel-chat-clear-user-messages",
            Self::ChannelShoutoutCreate => "channel-shoutout-create",
            Self::ChannelFollow => "channel-follow",
            Self::ChannelModerate => "channel-moderate",
            Self::AutomodMessageHold => "automod-message-hold",
            Self::AutomodMessageUpdate => "automod-message-update",
            Self::ChannelPointsCustomRewardRedemptionAdd => "channel-points-redemption-add",
        }
    }

    pub fn event_names() -> BTreeMap<Self, &'static str> {
        Self::ALL.iter().map(|&k| (k, k.event_name())).collect()
    }

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

#[cfg(test)]
mod tests {
    use super::EventKind;
    use std::collections::HashSet;

    #[test]
    fn event_names_are_unique() {
        let names: HashSet<_> = EventKind::ALL.iter().map(|k| k.event_name()).collect();
        assert_eq!(names.len(), EventKind::ALL.len());
    }

    #[test]
    fn all_lists_every_kind_once() {
        let kinds: HashSet<_> = EventKind::ALL.iter().collect();
        assert_eq!(kinds.len(), EventKind::ALL.len());
        assert_eq!(EventKind::event_names().len(), EventKind::ALL.len());
    }

    #[test]
    fn round_trips_twitch_subscription_type() {
        for kind in EventKind::ALL {
            let json = serde_json::to_string(&kind).unwrap();
            assert_eq!(serde_json::from_str::<EventKind>(&json).unwrap(), kind);
        }
        let parsed: EventKind = serde_json::from_str("\"channel.chat.message\"").unwrap();
        assert_eq!(parsed, EventKind::ChannelChatMessage);
    }
}
