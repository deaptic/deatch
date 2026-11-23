use serde::{Deserialize, Serialize};

const HELIX_FOLLOWER: &str = "follower";
const EVENTSUB_FOLLOW: &str = "follow";

#[derive(Debug, PartialEq, Deserialize)]
pub struct HelixGoal {
    id: String,
    #[serde(rename = "type")]
    kind: String,
    description: String,
    current_amount: i64,
    target_amount: i64,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Goal {
    pub id: String,
    pub kind: String,
    pub description: String,
    pub current: i64,
    pub target: i64,
}

impl From<HelixGoal> for Goal {
    fn from(g: HelixGoal) -> Self {
        Self {
            id: g.id,
            kind: if g.kind == HELIX_FOLLOWER {
                EVENTSUB_FOLLOW.into()
            } else {
                g.kind
            },
            description: g.description,
            current: g.current_amount,
            target: g.target_amount,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Goal, HelixGoal};
    use serde_json::json;

    fn goal(kind: &str) -> Goal {
        let helix: HelixGoal = serde_json::from_value(json!({
            "id": "g1",
            "broadcaster_id": "1",
            "type": kind,
            "description": "",
            "current_amount": 3,
            "target_amount": 10,
            "created_at": "2026-01-01T00:00:00Z",
        }))
        .unwrap();
        Goal::from(helix)
    }

    #[test]
    fn reads_goal_types_the_twitch_crate_does_not_know() {
        assert_eq!(goal("new_bit").kind, "new_bit");
        assert_eq!(goal("new_cheerer").kind, "new_cheerer");
    }

    #[test]
    fn names_follower_goals_like_eventsub_does() {
        let g = goal("follower");
        assert_eq!(g.kind, "follow");
        assert_eq!((g.current, g.target), (3, 10));
    }
}
