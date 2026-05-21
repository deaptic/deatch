use std::time::Duration;

use futures_util::{Sink, SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{Emitter, Manager};
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tokio_tungstenite::{connect_async, tungstenite::Message};

use super::{seventv::emote_url, EmoteEntry};

const WS_URL: &str = "wss://events.7tv.io/v3";
const EMOTE_SET_UPDATE: &str = "emote_set.update";
const UPDATE_EVENT: &str = "seventv-emote-set-updated";
const OP_DISPATCH: u8 = 0;
const OP_SUBSCRIBE: u8 = 35;
const OP_UNSUBSCRIBE: u8 = 36;

pub struct SevenTvEvents(UnboundedSender<Option<String>>);

pub fn spawn(app: tauri::AppHandle) {
    let (tx, rx) = unbounded_channel();
    app.manage(SevenTvEvents(tx));
    tauri::async_runtime::spawn(run(app, rx));
}

#[tauri::command]
pub fn seventv_watch_emote_set(
    state: tauri::State<SevenTvEvents>,
    emote_set_id: Option<String>,
) {
    let _ = state.0.send(emote_set_id);
}

async fn run(app: tauri::AppHandle, mut rx: UnboundedReceiver<Option<String>>) {
    let mut active: Option<String> = None;
    loop {
        let Ok((ws, _)) = connect_async(WS_URL).await else {
            tokio::time::sleep(Duration::from_secs(5)).await;
            continue;
        };
        let (mut write, mut read) = ws.split();
        if let Some(id) = &active {
            let _ = write.send(payload(OP_SUBSCRIBE, id)).await;
        }

        loop {
            tokio::select! {
                next = rx.recv() => match next {
                    None => return,
                    Some(new) => swap(&mut write, &mut active, new).await,
                },
                msg = read.next() => match msg {
                    Some(Ok(Message::Text(t))) => emit_delta(&app, &t),
                    Some(Ok(Message::Ping(p))) => { let _ = write.send(Message::Pong(p)).await; }
                    Some(Ok(_)) => {}
                    _ => break,
                }
            }
        }
        tokio::time::sleep(Duration::from_secs(3)).await;
    }
}

async fn swap<S: Sink<Message> + Unpin>(
    write: &mut S,
    active: &mut Option<String>,
    next: Option<String>,
) {
    if *active == next { return }
    if let Some(old) = active.take() {
        let _ = write.send(payload(OP_UNSUBSCRIBE, &old)).await;
    }
    if let Some(id) = &next {
        let _ = write.send(payload(OP_SUBSCRIBE, id)).await;
    }
    *active = next;
}

fn payload(op: u8, set_id: &str) -> Message {
    Message::Text(json!({
        "op": op,
        "d": { "type": EMOTE_SET_UPDATE, "condition": { "object_id": set_id } }
    }).to_string())
}

fn emit_delta(app: &tauri::AppHandle, text: &str) {
    if let Some(delta) = parse_delta(text) {
        let _ = app.emit(UPDATE_EVENT, delta);
    }
}

#[derive(Deserialize)]
struct Frame { op: u8, #[serde(default)] d: Value }

#[derive(Deserialize)]
struct Dispatch { #[serde(rename = "type")] kind: String, body: Body }

#[derive(Deserialize)]
struct Body {
    id: String,
    #[serde(default)] actor: Option<Actor>,
    #[serde(default)] pushed: Vec<Change>,
    #[serde(default)] pulled: Vec<Change>,
    #[serde(default)] updated: Vec<Change>,
}

#[derive(Deserialize)]
struct Actor {
    #[serde(default)] username: Option<String>,
    #[serde(default)] display_name: Option<String>,
}

#[derive(Deserialize)]
struct Change {
    key: String,
    #[serde(default)] value: Option<ActiveEmote>,
    #[serde(default)] old_value: Option<ActiveEmote>,
}

#[derive(Deserialize)]
struct ActiveEmote { id: String, name: String }

#[derive(Serialize, Clone)]
struct Delta {
    id: String,
    actor: Option<String>,
    added: Vec<EmoteEntry>,
    removed: Vec<String>,
    renamed: Vec<Rename>,
}

#[derive(Serialize, Clone)]
struct Rename { from: String, to: String }

fn is_emote(c: &Change) -> bool { c.key == "emotes" }

fn parse_delta(text: &str) -> Option<Delta> {
    let frame: Frame = serde_json::from_str(text).ok()?;
    if frame.op != OP_DISPATCH { return None }
    let d: Dispatch = serde_json::from_value(frame.d).ok()?;
    if d.kind != EMOTE_SET_UPDATE { return None }

    let added: Vec<_> = d.body.pushed.into_iter().filter(is_emote)
        .filter_map(|c| c.value)
        .map(|e| EmoteEntry { url: emote_url(&e.id), name: e.name })
        .collect();
    let removed: Vec<_> = d.body.pulled.into_iter().filter(is_emote)
        .filter_map(|c| c.old_value)
        .map(|e| e.name)
        .collect();
    let renamed: Vec<_> = d.body.updated.into_iter().filter(is_emote)
        .filter_map(|c| match (c.old_value, c.value) {
            (Some(o), Some(n)) if o.name != n.name => Some(Rename { from: o.name, to: n.name }),
            _ => None,
        })
        .collect();

    if added.is_empty() && removed.is_empty() && renamed.is_empty() {
        return None;
    }
    let actor = d.body.actor.and_then(|a| a.display_name.or(a.username));
    Some(Delta { id: d.body.id, actor, added, removed, renamed })
}
