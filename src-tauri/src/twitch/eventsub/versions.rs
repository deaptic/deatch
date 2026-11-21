use serde::{Deserialize, Serialize};
use twitch_api::eventsub::{EventSubscription, EventType};
use twitch_api::twitch_oauth2::{validator, Scope, Validator};
use twitch_api::types::UserId;

macro_rules! broadcaster_subscription {
    ($name:ident, $event:ident, $version:literal, $scope:expr) => {
        #[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
        pub(super) struct $name {
            pub broadcaster_user_id: UserId,
        }

        impl EventSubscription for $name {
            type Payload = serde_json::Value;

            const EVENT_TYPE: EventType = EventType::$event;
            const SCOPE: Validator = $scope;
            const VERSION: &'static str = $version;
        }
    };
}

broadcaster_subscription!(
    ChannelPointsAutomaticRewardRedemptionAddV2,
    ChannelPointsAutomaticRewardRedemptionAdd,
    "2",
    validator![any(
        Scope::ChannelReadRedemptions,
        Scope::ChannelManageRedemptions
    )]
);
broadcaster_subscription!(
    ChannelHypeTrainBeginV2,
    ChannelHypeTrainBegin,
    "2",
    validator![Scope::ChannelReadHypeTrain]
);
broadcaster_subscription!(
    ChannelHypeTrainProgressV2,
    ChannelHypeTrainProgress,
    "2",
    validator![Scope::ChannelReadHypeTrain]
);
broadcaster_subscription!(
    ChannelHypeTrainEndV2,
    ChannelHypeTrainEnd,
    "2",
    validator![Scope::ChannelReadHypeTrain]
);
