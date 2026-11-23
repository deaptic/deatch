use serde::Serialize;
use twitch_api::helix::subscriptions::BroadcasterSubscription;
use twitch_api::types::SubscriptionTier;

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Subscription {
    pub tier: u8,
    pub gifter_name: Option<String>,
}

impl Subscription {
    pub fn from_helix(s: BroadcasterSubscription) -> Option<Self> {
        let tier = match s.tier {
            SubscriptionTier::Tier1 | SubscriptionTier::Prime => 1,
            SubscriptionTier::Tier2 => 2,
            SubscriptionTier::Tier3 => 3,
            _ => return None,
        };
        Some(Self {
            tier,
            gifter_name: if s.is_gift {
                s.gifter_name.map(|n| n.to_string())
            } else {
                None
            },
        })
    }
}

#[cfg(test)]
mod tests {
    use super::Subscription;
    use serde_json::json;

    fn sub(tier: &str, is_gift: bool) -> Option<Subscription> {
        Subscription::from_helix(
            serde_json::from_value(json!({
                "broadcaster_id": "1",
                "broadcaster_login": "broadcaster",
                "broadcaster_name": "Broadcaster",
                "gifter_id": if is_gift { "3" } else { "" },
                "gifter_login": if is_gift { "viewer2" } else { "" },
                "gifter_name": if is_gift { "Viewer2" } else { "" },
                "is_gift": is_gift,
                "tier": tier,
                "plan_name": "Plan",
                "user_id": "2",
                "user_login": "viewer1",
                "user_name": "Viewer1",
            }))
            .unwrap(),
        )
    }

    #[test]
    fn maps_tiers_and_names_the_gifter_only_for_gifts() {
        assert_eq!(
            sub("2000", false),
            Some(Subscription {
                tier: 2,
                gifter_name: None
            })
        );
        assert_eq!(
            sub("1000", true),
            Some(Subscription {
                tier: 1,
                gifter_name: Some("Viewer2".into())
            })
        );
    }
}
