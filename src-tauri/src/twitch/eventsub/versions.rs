//! Subscription versions Twitch ships that `twitch_api` does not have yet.
//! Payloads stay raw JSON like every other kind, so only the condition,
//! version, and scope live here.

use serde::{Deserialize, Serialize};
use twitch_api::eventsub::{EventSubscription, EventType};
use twitch_api::twitch_oauth2::{validator, Scope, Validator};
use twitch_api::types::UserId;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub(super) struct ChannelPointsAutomaticRewardRedemptionAddV2 {
    pub broadcaster_user_id: UserId,
}

impl EventSubscription for ChannelPointsAutomaticRewardRedemptionAddV2 {
    type Payload = serde_json::Value;

    const EVENT_TYPE: EventType = EventType::ChannelPointsAutomaticRewardRedemptionAdd;
    const SCOPE: Validator = validator![any(
        Scope::ChannelReadRedemptions,
        Scope::ChannelManageRedemptions
    )];
    const VERSION: &'static str = "2";
}
