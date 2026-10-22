use std::collections::BTreeMap;

/// Every EventSub kind, once: its Twitch type, the Tauri event the backend
/// emits it as, and the least role and focus a channel needs for it. Rows are
/// in subscription priority: chat kinds first, so every channel's chat comes
/// up before anything else on (re)connect.
macro_rules! kinds {
    ($($kind:ident = $twitch:literal, $event:literal => ($role:ident, $focus:ident),)*) => {
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
            $(#[serde(rename = $twitch)] $kind,)*
        }

        impl EventKind {
            pub const ALL: [Self; [$(stringify!($kind)),*].len()] = [$(Self::$kind),*];

            pub fn event_name(self) -> &'static str {
                match self {
                    $(Self::$kind => $event,)*
                }
            }

            /// The least role that may subscribe, and the least focus a channel
            /// needs before it's worth the subscription.
            pub(super) fn requires(self) -> (Role, Focus) {
                match self {
                    $(Self::$kind => (Role::$role, Focus::$focus),)*
                }
            }
        }
    };
}

kinds! {
    ChannelChatMessage = "channel.chat.message", "channel-chat-message" => (Viewer, Background),
    ChannelChatNotification = "channel.chat.notification", "channel-chat-notification" => (Viewer, Background),
    ChannelChatMessageDelete = "channel.chat.message_delete", "channel-chat-message-delete" => (Viewer, Background),
    ChannelChatClear = "channel.chat.clear", "channel-chat-clear" => (Viewer, Background),
    ChannelChatClearUserMessages = "channel.chat.clear_user_messages", "channel-chat-clear-user-messages" => (Viewer, Background),
    ChannelChatSettingsUpdate = "channel.chat_settings.update", "channel-chat-settings-update" => (Viewer, Focused),
    // The broadcaster-only kinds marked "no auth" need no authorization, so on
    // a channel you don't own each costs 1 of the 10 Twitch allows a token's
    // WebSockets; on your own channel they are free.
    ChannelSharedChatBegin = "channel.shared_chat.begin", "channel-shared-chat-begin" => (Broadcaster, Focused), // no auth
    ChannelSharedChatUpdate = "channel.shared_chat.update", "channel-shared-chat-update" => (Broadcaster, Focused), // no auth
    ChannelSharedChatEnd = "channel.shared_chat.end", "channel-shared-chat-end" => (Broadcaster, Focused), // no auth
    ChannelShoutoutCreate = "channel.shoutout.create", "channel-shoutout-create" => (Moderator, Focused),
    ChannelShoutoutReceive = "channel.shoutout.receive", "channel-shoutout-receive" => (Moderator, Focused),
    ChannelFollow = "channel.follow", "channel-follow" => (Moderator, Focused),
    ChannelModerate = "channel.moderate", "channel-moderate" => (Moderator, Focused),
    ChannelUnbanRequestCreate = "channel.unban_request.create", "channel-unban-request-create" => (Moderator, Focused),
    ChannelUnbanRequestResolve = "channel.unban_request.resolve", "channel-unban-request-resolve" => (Moderator, Focused),
    ChannelWarningAcknowledge = "channel.warning.acknowledge", "channel-warning-acknowledge" => (Moderator, Focused),
    ChannelSuspiciousUserMessage = "channel.suspicious_user.message", "channel-suspicious-user-message" => (Moderator, Focused),
    ChannelSuspiciousUserUpdate = "channel.suspicious_user.update", "channel-suspicious-user-update" => (Moderator, Focused),
    AutomodMessageHold = "automod.message.hold", "automod-message-hold" => (Moderator, Background),
    AutomodMessageUpdate = "automod.message.update", "automod-message-update" => (Moderator, Background),
    ChannelPointsCustomRewardRedemptionAdd = "channel.channel_points_custom_reward_redemption.add", "channel-points-redemption-add" => (Broadcaster, Focused),
    ChannelPointsAutomaticRewardRedemptionAdd = "channel.channel_points_automatic_reward_redemption.add", "channel-points-automatic-redemption-add" => (Broadcaster, Focused),
    ChannelUpdate = "channel.update", "channel-update" => (Broadcaster, Focused), // no auth
    ChannelHypeTrainBegin = "channel.hype_train.begin", "channel-hype-train-begin" => (Broadcaster, Focused),
    ChannelHypeTrainProgress = "channel.hype_train.progress", "channel-hype-train-progress" => (Broadcaster, Focused),
    ChannelHypeTrainEnd = "channel.hype_train.end", "channel-hype-train-end" => (Broadcaster, Focused),
    ChannelPollBegin = "channel.poll.begin", "channel-poll-begin" => (Broadcaster, Focused),
    ChannelPollEnd = "channel.poll.end", "channel-poll-end" => (Broadcaster, Focused),
    ChannelPredictionBegin = "channel.prediction.begin", "channel-prediction-begin" => (Broadcaster, Focused),
    ChannelPredictionLock = "channel.prediction.lock", "channel-prediction-lock" => (Broadcaster, Focused),
    ChannelPredictionEnd = "channel.prediction.end", "channel-prediction-end" => (Broadcaster, Focused),
    ChannelGoalBegin = "channel.goal.begin", "channel-goal-begin" => (Broadcaster, Focused),
    ChannelGoalEnd = "channel.goal.end", "channel-goal-end" => (Broadcaster, Focused),
    ChannelAdBreakBegin = "channel.ad_break.begin", "channel-ad-break-begin" => (Broadcaster, Focused),
    ChannelBitsUse = "channel.bits.use", "channel-bits-use" => (Broadcaster, Focused),
    ChannelCharityCampaignStart = "channel.charity_campaign.start", "channel-charity-campaign-start" => (Broadcaster, Focused),
    ChannelCharityCampaignStop = "channel.charity_campaign.stop", "channel-charity-campaign-stop" => (Broadcaster, Focused),
    StreamOnline = "stream.online", "stream-online" => (Broadcaster, Focused), // no auth
    StreamOffline = "stream.offline", "stream-offline" => (Broadcaster, Focused), // no auth
}

impl EventKind {
    pub fn event_names() -> BTreeMap<Self, &'static str> {
        Self::ALL.iter().map(|&k| (k, k.event_name())).collect()
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
    fn event_names_follow_tauri_rules() {
        for kind in EventKind::ALL {
            let name = kind.event_name();
            assert!(
                name.chars().all(|c| c.is_ascii_alphanumeric() || c == '-'),
                "{name}"
            );
        }
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
