use std::collections::HashSet;

use serde::Deserialize;
use serde_json::{json, Value};

use super::events::{DeatchPresence, PresenceEntry, PresenceState};

pub const FEATURE: &str = "presence";
const SUBSCRIBE_BATCH: usize = 100;

/// Which chatters this session asked about, so a reconnect can ask again.
#[derive(Default)]
pub struct Presence {
    watching: HashSet<String>,
}

impl Presence {
    pub fn watch(&mut self, ids: Vec<String>) -> Vec<Value> {
        let fresh: Vec<String> = ids
            .into_iter()
            .filter(|id| self.watching.insert(id.clone()))
            .collect();
        subscribe_messages(&fresh)
    }

    pub fn resubscribe(&self) -> Vec<Value> {
        let all: Vec<String> = self.watching.iter().cloned().collect();
        subscribe_messages(&all)
    }
}

fn subscribe_messages(ids: &[String]) -> Vec<Value> {
    ids.chunks(SUBSCRIBE_BATCH)
        .map(|batch| json!({ "feature": FEATURE, "type": "subscribe", "twitchIds": batch }))
        .collect()
}

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum ServerMessage {
    Presence {
        entries: Vec<PresenceEntry>,
    },
    #[serde(rename_all = "camelCase")]
    Update {
        twitch_id: String,
        state: PresenceState,
    },
}

pub fn parse(body: Value) -> Option<DeatchPresence> {
    let entries = match serde_json::from_value(body).ok()? {
        ServerMessage::Presence { entries } => entries,
        ServerMessage::Update { twitch_id, state } => vec![PresenceEntry { twitch_id, state }],
    };
    Some(DeatchPresence { entries })
}

#[cfg(test)]
mod tests {
    use super::{parse, Presence};
    use serde_json::{json, Value};

    fn entries(body: Value) -> Option<Value> {
        parse(body).map(|u| serde_json::to_value(u.entries).unwrap())
    }

    #[test]
    fn maps_snapshot_and_update_to_entries() {
        let snapshot = json!({
            "type": "presence",
            "entries": [{ "twitchId": "1", "state": "online" }, { "twitchId": "2", "state": "unknown" }],
        });
        assert_eq!(
            entries(snapshot),
            Some(
                json!([{ "twitchId": "1", "state": "online" }, { "twitchId": "2", "state": "unknown" }])
            )
        );
        let update = json!({ "type": "update", "twitchId": "1", "state": "offline" });
        assert_eq!(
            entries(update),
            Some(json!([{ "twitchId": "1", "state": "offline" }]))
        );
    }

    #[test]
    fn ignores_garbage() {
        assert_eq!(entries(json!({ "type": "other" })), None);
    }

    #[test]
    fn asks_only_once_per_chatter_and_again_after_reconnect() {
        let mut presence = Presence::default();
        let first = presence.watch(vec!["1".into(), "2".into()]);
        assert_eq!(first[0]["twitchIds"].as_array().unwrap().len(), 2);
        assert!(presence.watch(vec!["1".into()]).is_empty());
        assert_eq!(presence.resubscribe()[0]["feature"], json!("presence"));
    }
}
