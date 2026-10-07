use std::collections::HashSet;
use std::time::Duration;

use futures_util::stream::SplitSink;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use serde_json::{json, Value};
use tauri::Manager;
use tokio::net::TcpStream;
use tokio::sync::mpsc::error::SendError;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};

use super::events::{EmoteSetUpdated, Rename};
use super::seventv::{to_entry, StvEmote};
use crate::emit::emit;

const WS_URL: &str = "wss://events.7tv.io/v3";
const EMOTE_SET_UPDATE: &str = "emote_set.update";
const OP_DISPATCH: u8 = 0;
const OP_SUBSCRIBE: u8 = 35;
const OP_UNSUBSCRIBE: u8 = 36;
const RECONNECT_DELAY: Duration = Duration::from_secs(5);

type Writer = SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>;

#[derive(Debug)]
pub enum SevenTvOp {
    Subscribe(String),
    Unsubscribe(String),
}

pub struct SevenTvEvents(UnboundedSender<SevenTvOp>);

impl SevenTvEvents {
    pub fn request(&self, op: SevenTvOp) {
        if let Err(SendError(op)) = self.0.send(op) {
            log::error!("7tv events task stopped, dropped {op:?}");
        }
    }
}

pub fn spawn(app: tauri::AppHandle) {
    let (tx, rx) = unbounded_channel();
    app.manage(SevenTvEvents(tx));
    tauri::async_runtime::spawn(run(app, rx));
}

enum End {
    Lost,
    Stopped,
}

async fn run(app: tauri::AppHandle, mut rx: UnboundedReceiver<SevenTvOp>) {
    let mut active = HashSet::new();
    loop {
        match connect_async(WS_URL).await {
            Ok((socket, _)) => {
                if let End::Stopped = serve(&app, socket, &mut rx, &mut active).await {
                    return;
                }
            }
            Err(e) => log::warn!("7tv connect failed: {e}"),
        }
        tokio::time::sleep(RECONNECT_DELAY).await;
    }
}

async fn serve(
    app: &tauri::AppHandle,
    socket: WebSocketStream<MaybeTlsStream<TcpStream>>,
    rx: &mut UnboundedReceiver<SevenTvOp>,
    active: &mut HashSet<String>,
) -> End {
    log::info!("7tv connected, resubscribing {} emote sets", active.len());
    let (mut write, mut read) = socket.split();
    for id in active.iter() {
        send(&mut write, OP_SUBSCRIBE, id).await;
    }
    loop {
        tokio::select! {
            op = rx.recv() => match op {
                Some(op) => apply(&mut write, active, op).await,
                None => return End::Stopped,
            },
            message = read.next() => match message {
                Some(Ok(Message::Text(text))) => {
                    if let Some(update) = parse_update(&text) {
                        emit(app, update);
                    }
                }
                Some(Ok(Message::Close(frame))) => {
                    log::info!("7tv closed by server: {frame:?}");
                    return End::Lost;
                }
                Some(Ok(_)) => {}
                Some(Err(e)) => {
                    log::warn!("7tv socket error: {e}");
                    return End::Lost;
                }
                None => {
                    log::info!("7tv socket ended");
                    return End::Lost;
                }
            }
        }
    }
}

async fn apply(write: &mut Writer, active: &mut HashSet<String>, op: SevenTvOp) {
    match op {
        SevenTvOp::Subscribe(id) => {
            if active.insert(id.clone()) {
                log::info!("7tv subscribe emote_set={id}");
                send(write, OP_SUBSCRIBE, &id).await;
            }
        }
        SevenTvOp::Unsubscribe(id) => {
            if active.remove(&id) {
                log::info!("7tv unsubscribe emote_set={id}");
                send(write, OP_UNSUBSCRIBE, &id).await;
            }
        }
    }
}

async fn send(write: &mut Writer, op: u8, set_id: &str) {
    let request = json!({
        "op": op,
        "d": { "type": EMOTE_SET_UPDATE, "condition": { "object_id": set_id } },
    });
    if let Err(e) = write.send(Message::Text(request.to_string().into())).await {
        log::warn!("7tv send failed: {e}");
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

/// Values stay untyped until the key says they are emotes: a frame mixes
/// emote changes with other keys whose values have different shapes.
#[derive(Deserialize)]
struct Change {
    key: String,
    #[serde(default)]
    value: Value,
    #[serde(default)]
    old_value: Value,
}

fn emote(value: Value) -> Option<StvEmote> {
    serde_json::from_value(value).ok()
}

fn emote_changes(changes: Vec<Change>) -> impl Iterator<Item = Change> {
    changes.into_iter().filter(|c| c.key == "emotes")
}

fn parse_update(text: &str) -> Option<EmoteSetUpdated> {
    let frame: Frame = serde_json::from_str(text).ok()?;
    if frame.op != OP_DISPATCH {
        return None;
    }
    let Dispatch { kind, body } = serde_json::from_value(frame.d).ok()?;
    if kind != EMOTE_SET_UPDATE {
        return None;
    }

    let added: Vec<_> = emote_changes(body.pushed)
        .filter_map(|c| emote(c.value))
        .map(to_entry)
        .collect();
    let removed: Vec<_> = emote_changes(body.pulled)
        .filter_map(|c| emote(c.old_value))
        .map(|e| e.name)
        .collect();
    let renamed: Vec<_> = emote_changes(body.updated)
        .filter_map(|c| match (emote(c.old_value), emote(c.value)) {
            (Some(old), Some(new)) if old.name != new.name => Some(Rename {
                from: old.name,
                to: new.name,
            }),
            _ => None,
        })
        .collect();

    if added.is_empty() && removed.is_empty() && renamed.is_empty() {
        return None;
    }
    let actor = body.actor.and_then(|a| a.display_name.or(a.username));
    Some(EmoteSetUpdated {
        id: body.id,
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
    fn keeps_emote_changes_next_to_other_shaped_values() {
        let text = frame(json!({
            "id": "set1",
            "updated": [{ "key": "name", "old_value": "Old set", "value": "New set" }],
            "pushed": [{ "key": "emotes", "value": { "id": "e1", "name": "Pog" } }],
        }));
        assert_eq!(
            update_json(&text).unwrap()["added"][0]["name"],
            json!("Pog")
        );
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
