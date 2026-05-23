use std::collections::{HashMap, HashSet};
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use tauri::{Emitter, Manager};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::Message as WsMessage};

use twitch_api::twitch_oauth2::UserToken;

use super::dispatch::handle_ws_message;
use super::subscribe::{create_subscription, delete_subscription, emit_failed};
use super::{EventKind, EventSubCmd, WS_URL};
use super::super::moderation::get_all_moderated_channels;
use super::super::{cache_moderated_channel_ids, get_token, helix, TwitchState};

pub(super) struct ChannelSub {
    pub(super) is_mod: bool,
    /// Survives reconnects so `resubscribe_pending` can recreate them.
    pub(super) requested: HashSet<EventKind>,
    /// Cleared on fresh reconnect; preserved on Twitch-initiated session migration.
    pub(super) sub_ids: HashMap<EventKind, String>,
}

pub(super) async fn ensure_task(app: &tauri::AppHandle) -> Result<(), String> {
    // Hold the init mutex for the entire setup so concurrent callers wait
    // here instead of racing through their own auth checks and clobbering
    // each other's tx slots. By the time we drop the guard, either a task
    // is running and the tx slot is committed, or initialization failed and
    // the slot is empty — concurrent callers re-check after acquiring.
    let state = app.state::<TwitchState>();
    let _init_guard = state.eventsub_init.lock().await;

    if state.eventsub_tx.lock().unwrap().is_some() {
        return Ok(());
    }

    // Verify auth before committing to a task — failure leaves the slot
    // empty so the next caller can retry.
    let token = get_token(app).await?;

    // Refreshes the moderated_channel_ids cache so handle_cmd can read it
    // synchronously when deciding is_mod. Non-fatal — is_mod defaults to
    // false until the next refresh.
    match get_all_moderated_channels(&token).await {
        Ok(channels) => cache_moderated_channel_ids(app, &channels),
        Err(e) => {
            let _ = app.emit("eventsub-error", format!("fetch moderated channels failed: {e}"));
        }
    }

    let (tx, rx) = mpsc::unbounded_channel();
    *state.eventsub_tx.lock().unwrap() = Some(tx);

    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = run(app.clone(), rx).await {
            let _ = app.emit("eventsub-error", e);
        }
        // Clear the tx so the next subscribe call respawns the task.
        *app.state::<TwitchState>().eventsub_tx.lock().unwrap() = None;
    });
    Ok(())
}

async fn run(
    app: tauri::AppHandle,
    mut cmd_rx: mpsc::UnboundedReceiver<EventSubCmd>,
) -> Result<(), String> {
    let helix = helix();
    let mut url = WS_URL.to_string();
    let mut subs: HashMap<String, ChannelSub> = HashMap::new();
    let mut is_reconnect = false;

    loop {
        let Ok((ws, _)) = connect_async(url.as_str()).await else {
            url = WS_URL.to_string();
            is_reconnect = false;
            tokio::time::sleep(Duration::from_secs(5)).await;
            continue;
        };

        let (mut write, mut read) = ws.split();
        let mut next_url: Option<String> = None;
        let mut session_id: Option<String> = None;
        // On a Twitch-initiated reconnect (via reconnect URL), subscriptions
        // are migrated to the new session — keep sub IDs. On a fresh
        // connection, old subs are dead — clear so Welcome re-subscribes.
        if !is_reconnect {
            for sub in subs.values_mut() {
                sub.sub_ids.clear();
            }
        }

        loop {
            tokio::select! {
                cmd = cmd_rx.recv() => match cmd {
                    Some(cmd) => handle_cmd(&app, &helix, &mut subs, session_id.as_deref(), cmd).await,
                    None => return Ok(()),
                },
                msg = read.next() => match msg {
                    Some(Ok(WsMessage::Text(text))) => {
                        match handle_ws_message(&app, &helix, &mut subs, &mut session_id, &text).await {
                            Ok(Some(reconnect)) => { next_url = Some(reconnect); break; }
                            Err(e) => { let _ = app.emit("eventsub-error", e); }
                            _ => {}
                        }
                    }
                    Some(Ok(_)) => {}
                    _ => break,
                }
            }
            let _ = write.flush().await;
        }

        is_reconnect = next_url.is_some();
        url = next_url.unwrap_or_else(|| WS_URL.to_string());
        if !is_reconnect {
            // Fresh disconnect — every live sub_id is dead. `requested` survives
            // so resubscribe-on-Welcome will re-emit `eventsub-subscribed`.
            for (broadcaster_id, sub) in subs.iter() {
                for kind in sub.sub_ids.keys() {
                    println!("[eventsub] unsubscribed kind={kind:?} broadcaster={broadcaster_id} (ws disconnect)");
                    let _ = app.emit(
                        "eventsub-unsubscribed",
                        serde_json::json!({
                            "broadcaster_id": broadcaster_id,
                            "kind": kind,
                        }),
                    );
                }
            }
            tokio::time::sleep(Duration::from_secs(3)).await;
        }
    }
}

async fn handle_cmd(
    app: &tauri::AppHandle,
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    subs: &mut HashMap<String, ChannelSub>,
    session_id: Option<&str>,
    cmd: EventSubCmd,
) {
    match cmd {
        EventSubCmd::Subscribe { broadcaster_id, kind } => {
            let token = match get_token(app).await {
                Ok(t) => t,
                Err(e) => {
                    emit_failed(app, &broadcaster_id, kind, e);
                    return;
                }
            };

            let entry = subs.entry(broadcaster_id.clone()).or_insert_with(|| ChannelSub {
                is_mod: is_mod_of(app, &token, &broadcaster_id),
                requested: HashSet::new(),
                sub_ids: HashMap::new(),
            });

            if entry.requested.contains(&kind) {
                return;
            }

            if kind.requires_mod() && !entry.is_mod {
                emit_failed(app, &broadcaster_id, kind, "not a moderator");
                if entry.requested.is_empty() && entry.sub_ids.is_empty() {
                    subs.remove(&broadcaster_id);
                }
                return;
            }

            entry.requested.insert(kind);

            // No session yet — Welcome handler will create the sub.
            let Some(sid) = session_id else { return };

            match create_subscription(app, helix, &token, &broadcaster_id, kind, sid).await {
                Some(id) => {
                    entry.sub_ids.insert(kind, id);
                }
                None => {
                    // Drop from requested so a subsequent subscribe call can retry
                    // (create_subscription already emitted the failure).
                    entry.requested.remove(&kind);
                    if entry.requested.is_empty() && entry.sub_ids.is_empty() {
                        subs.remove(&broadcaster_id);
                    }
                }
            }
        }
        EventSubCmd::Unsubscribe { broadcaster_id, kind } => {
            let Some(entry) = subs.get_mut(&broadcaster_id) else { return };
            entry.requested.remove(&kind);
            if let Some(sub_id) = entry.sub_ids.remove(&kind) {
                println!("[eventsub] unsubscribe kind={kind:?} broadcaster={broadcaster_id}");
                if let Ok(token) = get_token(app).await {
                    let _ = delete_subscription(helix, &token, &sub_id).await;
                }
            }
            if entry.requested.is_empty() && entry.sub_ids.is_empty() {
                subs.remove(&broadcaster_id);
            }
        }
    }
}

fn is_mod_of(app: &tauri::AppHandle, token: &UserToken, broadcaster_id: &str) -> bool {
    if broadcaster_id == token.user_id.as_str() {
        return true;
    }
    app.state::<TwitchState>()
        .moderated_channel_ids
        .lock()
        .unwrap()
        .contains(broadcaster_id)
}
