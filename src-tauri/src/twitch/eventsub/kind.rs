use std::collections::BTreeMap;

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
    ChannelSharedChatBegin = "channel.shared_chat.begin", "channel-shared-chat-begin" => (Broadcaster, Focused),
    ChannelSharedChatUpdate = "channel.shared_chat.update", "channel-shared-chat-update" => (Broadcaster, Focused),
    ChannelSharedChatEnd = "channel.shared_chat.end", "channel-shared-chat-end" => (Broadcaster, Focused),
    ChannelShoutoutCreate = "channel.shoutout.create", "channel-shoutout-create" => (Moderator, Focused),
    ChannelShoutoutReceive = "channel.shoutout.receive", "channel-shoutout-receive" => (Moderator, Focused),
    ChannelFollow = "channel.follow", "channel-follow" => (Moderator, Focused),
    ChannelModerate = "channel.moderate", "channel-moderate" => (Moderator, Focused),
    ChannelUnbanRequestCreate = "channel.unban_request.create", "channel-unban-request-create" => (Moderator, Focused),
    ChannelUnbanRequestResolve = "channel.unban_request.resolve", "channel-unban-request-resolve" => (Moderator, Focused),
    ChannelWarningAcknowledge = "channel.warning.acknowledge", "channel-warning-acknowledge" => (Moderator, Focused),
    ChannelSuspiciousUserMessage = "channel.suspicious_user.message", "channel-suspicious-user-message" => (Moderator, Focused),
    ChannelSuspiciousUserUpdate = "channel.suspicious_user.update", "channel-suspicious-user-update" => (Moderator, Focused),
    ChannelShieldModeBegin = "channel.shield_mode.begin", "channel-shield-mode-begin" => (Moderator, Focused),
    ChannelShieldModeEnd = "channel.shield_mode.end", "channel-shield-mode-end" => (Moderator, Focused),
    AutomodMessageHold = "automod.message.hold", "automod-message-hold" => (Moderator, Background),
    AutomodMessageUpdate = "automod.message.update", "automod-message-update" => (Moderator, Background),
    ChannelPointsCustomRewardRedemptionAdd = "channel.channel_points_custom_reward_redemption.add", "channel-points-redemption-add" => (Broadcaster, Focused),
    ChannelPointsAutomaticRewardRedemptionAdd = "channel.channel_points_automatic_reward_redemption.add", "channel-points-automatic-redemption-add" => (Broadcaster, Focused),
    ChannelUpdate = "channel.update", "channel-update" => (Broadcaster, Focused),
    ChannelHypeTrainBegin = "channel.hype_train.begin", "channel-hype-train-begin" => (Broadcaster, Focused),
    ChannelHypeTrainProgress = "channel.hype_train.progress", "channel-hype-train-progress" => (Broadcaster, Focused),
    ChannelHypeTrainEnd = "channel.hype_train.end", "channel-hype-train-end" => (Broadcaster, Focused),
    ChannelPollBegin = "channel.poll.begin", "channel-poll-begin" => (Broadcaster, Focused),
    ChannelPollProgress = "channel.poll.progress", "channel-poll-progress" => (Broadcaster, Focused),
    ChannelPollEnd = "channel.poll.end", "channel-poll-end" => (Broadcaster, Focused),
    ChannelPredictionBegin = "channel.prediction.begin", "channel-prediction-begin" => (Broadcaster, Focused),
    ChannelPredictionProgress = "channel.prediction.progress", "channel-prediction-progress" => (Broadcaster, Focused),
    ChannelPredictionLock = "channel.prediction.lock", "channel-prediction-lock" => (Broadcaster, Focused),
    ChannelPredictionEnd = "channel.prediction.end", "channel-prediction-end" => (Broadcaster, Focused),
    ChannelGoalBegin = "channel.goal.begin", "channel-goal-begin" => (Broadcaster, Focused),
    ChannelGoalEnd = "channel.goal.end", "channel-goal-end" => (Broadcaster, Focused),
    ChannelAdBreakBegin = "channel.ad_break.begin", "channel-ad-break-begin" => (Broadcaster, Focused),
    ChannelBitsUse = "channel.bits.use", "channel-bits-use" => (Broadcaster, Focused),
    ChannelCharityCampaignStart = "channel.charity_campaign.start", "channel-charity-campaign-start" => (Broadcaster, Focused),
    ChannelCharityCampaignStop = "channel.charity_campaign.stop", "channel-charity-campaign-stop" => (Broadcaster, Focused),
    StreamOnline = "stream.online", "stream-online" => (Broadcaster, Focused),
    StreamOffline = "stream.offline", "stream-offline" => (Broadcaster, Focused),
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
