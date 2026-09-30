use std::collections::HashSet;
use std::time::Duration;

use futures_util::{Sink, SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::Manager;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tokio_tungstenite::{connect_async, tungstenite::Message};

use super::seventv::emote_url;
use crate::emit::emit;
use crate::emotes::dto::EmoteEntry;
use crate::emotes::dto::{EmoteSetUpdated, Rename};

const WS_URL: &str = "wss://events.7tv.io/v3";
const EMOTE_SET_UPDATE: &str = "emote_set.update";
const OP_DISPATCH: u8 = 0;
const OP_SUBSCRIBE: u8 = 35;
const OP_UNSUBSCRIBE: u8 = 36;

pub enum SevenTvOp {
    Subscribe(String),
    Unsubscribe(String),
}

pub struct SevenTvEvents(pub UnboundedSender<SevenTvOp>);

pub fn spawn(app: tauri::AppHandle) {
    let (tx, rx) = unbounded_channel();
    app.manage(SevenTvEvents(tx));
    tauri::async_runtime::spawn(run(app, rx));
}

async fn run(app: tauri::AppHandle, mut rx: UnboundedReceiver<SevenTvOp>) {
    let mut active: HashSet<String> = HashSet::new();
    loop {
        let Ok((ws, _)) = connect_async(WS_URL).await else {
            tokio::time::sleep(Duration::from_secs(5)).await;
            continue;
        };
        let (mut write, mut read) = ws.split();
        for id in &active {
            let _ = write.send(payload(OP_SUBSCRIBE, id)).await;
        }

        loop {
            tokio::select! {
                next = rx.recv() => match next {
                    None => return,
                    Some(op) => apply(&mut write, &mut active, op).await,
                },
                msg = read.next() => match msg {
                    Some(Ok(Message::Text(t))) => emit_update(&app, &t),
                    Some(Ok(Message::Ping(p))) => { let _ = write.send(Message::Pong(p)).await; }
                    Some(Ok(_)) => {}
                    _ => break,
                }
            }
        }
        tokio::time::sleep(Duration::from_secs(3)).await;
    }
}

async fn apply<S: Sink<Message> + Unpin>(
    write: &mut S,
    active: &mut HashSet<String>,
    op: SevenTvOp,
) {
    match op {
        SevenTvOp::Subscribe(id) => {
            if active.insert(id.clone()) {
                let _ = write.send(payload(OP_SUBSCRIBE, &id)).await;
            }
        }
        SevenTvOp::Unsubscribe(id) => {
            if active.remove(&id) {
                let _ = write.send(payload(OP_UNSUBSCRIBE, &id)).await;
            }
        }
    }
}

#[derive(Serialize)]
struct Request<'a> {
    op: u8,
    d: Subscription<'a>,
}

#[derive(Serialize)]
struct Subscription<'a> {
    #[serde(rename = "type")]
    kind: &'static str,
    condition: Condition<'a>,
}

#[derive(Serialize)]
struct Condition<'a> {
    object_id: &'a str,
}

fn payload(op: u8, set_id: &str) -> Message {
    let request = Request {
        op,
        d: Subscription {
            kind: EMOTE_SET_UPDATE,
            condition: Condition { object_id: set_id },
        },
    };
    let text = serde_json::to_string(&request).expect("7TV request is always serializable");
    Message::Text(text.into())
}
fn emit_update(app: &tauri::AppHandle, text: &str) {
    if let Some(update) = parse_update(text) {
        emit(app, update);
    }
}

#[derive(Deserialize)]
struct Frame {
    op: u8,
    #[serde(default)]
    d: Value,
}

#[derive(Deserialize)]
struct Dispatch {
    #[serde(rename = "type")]
    kind: String,
    body: Body,
}

#[derive(Deserialize)]
struct Body {
    id: String,
    #[serde(default)]
    actor: Option<Actor>,
    #[serde(default)]
    pushed: Vec<Change>,
    #[serde(default)]
    pulled: Vec<Change>,
    #[serde(default)]
    updated: Vec<Change>,
}

#[derive(Deserialize)]
struct Actor {
    #[serde(default)]
    username: Option<String>,
    #[serde(default)]
    display_name: Option<String>,
}

#[derive(Deserialize)]
struct Change {
    key: String,
    #[serde(default)]
    value: Option<ActiveEmote>,
    #[serde(default)]
    old_value: Option<ActiveEmote>,
}

#[derive(Deserialize)]
struct ActiveEmote {
    id: String,
    name: String,
}

fn is_emote(c: &Change) -> bool {
    c.key == "emotes"
}

fn parse_update(text: &str) -> Option<EmoteSetUpdated> {
    let frame: Frame = serde_json::from_str(text).ok()?;
    if frame.op != OP_DISPATCH {
        return None;
    }
    let d: Dispatch = serde_json::from_value(frame.d).ok()?;
    if d.kind != EMOTE_SET_UPDATE {
        return None;
    }

    let added: Vec<_> = d
        .body
        .pushed
        .into_iter()
        .filter(is_emote)
        .filter_map(|c| c.value)
        .map(|e| EmoteEntry {
            url: emote_url(&e.id),
            name: e.name,
        })
        .collect();
    let removed: Vec<_> = d
        .body
        .pulled
        .into_iter()
        .filter(is_emote)
        .filter_map(|c| c.old_value)
        .map(|e| e.name)
        .collect();
    let renamed: Vec<_> = d
        .body
        .updated
        .into_iter()
        .filter(is_emote)
        .filter_map(|c| match (c.old_value, c.value) {
            (Some(o), Some(n)) if o.name != n.name => Some(Rename {
                from: o.name,
                to: n.name,
            }),
            _ => None,
        })
        .collect();

    if added.is_empty() && removed.is_empty() && renamed.is_empty() {
        return None;
    }
    let actor = d.body.actor.and_then(|a| a.display_name.or(a.username));
    Some(EmoteSetUpdated {
        id: d.body.id,
        actor,
        added,
        removed,
        renamed,
    })
}

#[cfg(test)]
mod tests {
    use super::parse_update;
    use serde_json::{json, Value};

    fn frame(body: Value) -> String {
        json!({ "op": 0, "d": { "type": "emote_set.update", "body": body } }).to_string()
    }

    fn update_json(text: &str) -> Option<Value> {
        parse_update(text).map(|u| serde_json::to_value(u).unwrap())
    }

    #[test]
    fn collects_added_removed_and_renamed_emotes() {
        let text = frame(json!({
            "id": "set1",
            "actor": { "username": "foo", "display_name": "Foo" },
            "pushed": [{ "key": "emotes", "value": { "id": "e1", "name": "Pog" } }],
            "pulled": [{ "key": "emotes", "old_value": { "id": "e2", "name": "Kek" } }],
            "updated": [{
                "key": "emotes",
                "old_value": { "id": "e3", "name": "Old" },
                "value": { "id": "e3", "name": "New" },
            }],
        }));
        assert_eq!(
            update_json(&text),
            Some(json!({
                "id": "set1",
                "actor": "Foo",
                "added": [{ "name": "Pog", "url": "https://cdn.7tv.app/emote/e1/1x.webp" }],
                "removed": ["Kek"],
                "renamed": [{ "from": "Old", "to": "New" }],
            }))
        );
    }

    #[test]
    fn falls_back_to_username_for_actor() {
        let text = frame(json!({
            "id": "set1",
            "actor": { "username": "foo" },
            "pushed": [{ "key": "emotes", "value": { "id": "e1", "name": "Pog" } }],
        }));
        assert_eq!(update_json(&text).unwrap()["actor"], json!("foo"));
    }

    #[test]
    fn ignores_non_emote_changes_and_unchanged_names() {
        let text = frame(json!({
            "id": "set1",
            "pushed": [{ "key": "name", "value": { "id": "x", "name": "x" } }],
            "updated": [{
                "key": "emotes",
                "old_value": { "id": "e3", "name": "Same" },
                "value": { "id": "e3", "name": "Same" },
            }],
        }));
        assert_eq!(update_json(&text), None);
    }

    #[test]
    fn ignores_other_ops_and_event_types() {
        let hello = json!({ "op": 1, "d": {} }).to_string();
        let other =
            json!({ "op": 0, "d": { "type": "user.update", "body": { "id": "u1" } } }).to_string();
        assert_eq!(update_json(&hello), None);
        assert_eq!(update_json(&other), None);
        assert_eq!(update_json("not json"), None);
    }
}
