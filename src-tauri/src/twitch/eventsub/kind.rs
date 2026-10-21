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
    #[serde(rename = "channel.chat_settings.update")]
    ChannelChatSettingsUpdate,
    #[serde(rename = "channel.shared_chat.begin")]
    ChannelSharedChatBegin,
    #[serde(rename = "channel.shared_chat.update")]
    ChannelSharedChatUpdate,
    #[serde(rename = "channel.shared_chat.end")]
    ChannelSharedChatEnd,
    #[serde(rename = "channel.shoutout.create")]
    ChannelShoutoutCreate,
    #[serde(rename = "channel.shoutout.receive")]
    ChannelShoutoutReceive,
    #[serde(rename = "channel.follow")]
    ChannelFollow,
    #[serde(rename = "channel.moderate")]
    ChannelModerate,
    #[serde(rename = "channel.unban_request.create")]
    ChannelUnbanRequestCreate,
    #[serde(rename = "channel.unban_request.resolve")]
    ChannelUnbanRequestResolve,
    #[serde(rename = "channel.warning.acknowledge")]
    ChannelWarningAcknowledge,
    #[serde(rename = "automod.message.hold")]
    AutomodMessageHold,
    #[serde(rename = "automod.message.update")]
    AutomodMessageUpdate,
    #[serde(rename = "channel.channel_points_custom_reward_redemption.add")]
    ChannelPointsCustomRewardRedemptionAdd,
    #[serde(rename = "channel.channel_points_automatic_reward_redemption.add")]
    ChannelPointsAutomaticRewardRedemptionAdd,
    #[serde(rename = "channel.update")]
    ChannelUpdate,
    #[serde(rename = "stream.online")]
    StreamOnline,
    #[serde(rename = "stream.offline")]
    StreamOffline,
}

impl EventKind {
    /// Ordered by subscription priority: chat kinds first so every channel's
    /// chat comes up before anything else on (re)connect.
    pub const ALL: [Self; 23] = [
        Self::ChannelChatMessage,
        Self::ChannelChatNotification,
        Self::ChannelChatMessageDelete,
        Self::ChannelChatClear,
        Self::ChannelChatClearUserMessages,
        Self::ChannelChatSettingsUpdate,
        Self::ChannelSharedChatBegin,
        Self::ChannelSharedChatUpdate,
        Self::ChannelSharedChatEnd,
        Self::ChannelShoutoutCreate,
        Self::ChannelShoutoutReceive,
        Self::ChannelFollow,
        Self::ChannelModerate,
        Self::ChannelUnbanRequestCreate,
        Self::ChannelUnbanRequestResolve,
        Self::ChannelWarningAcknowledge,
        Self::AutomodMessageHold,
        Self::AutomodMessageUpdate,
        Self::ChannelPointsCustomRewardRedemptionAdd,
        Self::ChannelPointsAutomaticRewardRedemptionAdd,
        Self::ChannelUpdate,
        Self::StreamOnline,
        Self::StreamOffline,
    ];

    pub fn event_name(self) -> &'static str {
        match self {
            Self::ChannelChatMessage => "channel-chat-message",
            Self::ChannelChatNotification => "channel-chat-notification",
            Self::ChannelChatMessageDelete => "channel-chat-message-delete",
            Self::ChannelChatClear => "channel-chat-clear",
            Self::ChannelChatClearUserMessages => "channel-chat-clear-user-messages",
            Self::ChannelChatSettingsUpdate => "channel-chat-settings-update",
            Self::ChannelSharedChatBegin => "channel-shared-chat-begin",
            Self::ChannelSharedChatUpdate => "channel-shared-chat-update",
            Self::ChannelSharedChatEnd => "channel-shared-chat-end",
            Self::ChannelShoutoutCreate => "channel-shoutout-create",
            Self::ChannelShoutoutReceive => "channel-shoutout-receive",
            Self::ChannelFollow => "channel-follow",
            Self::ChannelModerate => "channel-moderate",
            Self::ChannelUnbanRequestCreate => "channel-unban-request-create",
            Self::ChannelUnbanRequestResolve => "channel-unban-request-resolve",
            Self::ChannelWarningAcknowledge => "channel-warning-acknowledge",
            Self::AutomodMessageHold => "automod-message-hold",
            Self::AutomodMessageUpdate => "automod-message-update",
            Self::ChannelPointsCustomRewardRedemptionAdd => "channel-points-redemption-add",
            Self::ChannelPointsAutomaticRewardRedemptionAdd => {
                "channel-points-automatic-redemption-add"
            }
            Self::ChannelUpdate => "channel-update",
            Self::StreamOnline => "stream-online",
            Self::StreamOffline => "stream-offline",
        }
    }

    pub fn event_names() -> BTreeMap<Self, &'static str> {
        Self::ALL.iter().map(|&k| (k, k.event_name())).collect()
    }

    /// The least role that may subscribe, and the least focus a channel
    /// needs before it's worth the subscription.
    pub(super) fn requires(self) -> (Role, Focus) {
        use Focus::{Background, Focused};
        match self {
            Self::ChannelChatMessage
            | Self::ChannelChatNotification
            | Self::ChannelChatMessageDelete
            | Self::ChannelChatClear
            | Self::ChannelChatClearUserMessages => (Role::Viewer, Background),
            Self::ChannelChatSettingsUpdate
            | Self::ChannelSharedChatBegin
            | Self::ChannelSharedChatUpdate
            | Self::ChannelSharedChatEnd
            | Self::StreamOnline
            | Self::StreamOffline => (Role::Viewer, Focused),
            Self::AutomodMessageHold | Self::AutomodMessageUpdate => (Role::Moderator, Background),
            Self::ChannelShoutoutCreate
            | Self::ChannelShoutoutReceive
            | Self::ChannelFollow
            | Self::ChannelModerate
            | Self::ChannelUnbanRequestCreate
            | Self::ChannelUnbanRequestResolve
            | Self::ChannelWarningAcknowledge => (Role::Moderator, Focused),
            Self::ChannelPointsCustomRewardRedemptionAdd
            | Self::ChannelPointsAutomaticRewardRedemptionAdd
            | Self::ChannelUpdate => (Role::Broadcaster, Focused),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum Focus {
    Focused,
    Background,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub(super) enum Role {
    Viewer,
    Moderator,
    Broadcaster,
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
    fn all_is_in_declaration_order() {
        assert!(EventKind::ALL.is_sorted());
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
