use std::collections::HashMap;
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use tauri::{Emitter, Manager};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::Message as WsMessage};

use twitch_api::twitch_oauth2::UserToken;

use super::dispatch::handle_ws_message;
use super::subscribe::{create_subscriptions, delete_subscription};
use super::{EventSubCmd, WS_URL};
use crate::twitch::moderation::get_all_moderated_channels;
use crate::twitch::{get_token, helix, TwitchState};

pub(super) struct ChannelSub {
    pub(super) is_mod: bool,
    pub(super) sub_ids: Vec<String>,
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
    get_token(app).await?;

    // Refreshes the moderated_channel_ids cache as a side effect so handle_cmd
    // can read it synchronously when deciding is_mod. Non-fatal — is_mod
    // defaults to false until the next refresh.
    if let Err(e) = get_all_moderated_channels(app.clone()).await {
        let _ = app.emit("eventsub-error", format!("fetch moderated channels failed: {e}"));
    }

    let (tx, rx) = mpsc::unbounded_channel();
    *state.eventsub_tx.lock().unwrap() = Some(tx);

    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = run(app.clone(), rx).await {
            let _ = app.emit("eventsub-error", e);
        }
        // Clear the tx so the next subscribe_channel call respawns the task.
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
        EventSubCmd::Add { broadcaster_id } => {
            if subs.contains_key(&broadcaster_id) {
                return;
            }
            let token = match get_token(app).await {
                Ok(t) => t,
                Err(e) => {
                    let _ = app.emit("eventsub-error", e);
                    return;
                }
            };
            let is_mod = is_mod_of(app, &token, &broadcaster_id);
            let Some(sid) = session_id else {
                // No session yet — record so we subscribe on Welcome.
                subs.insert(broadcaster_id, ChannelSub { is_mod, sub_ids: vec![] });
                return;
            };
            let sub_ids = create_subscriptions(app, helix, &token, &broadcaster_id, is_mod, sid).await;
            subs.insert(broadcaster_id, ChannelSub { is_mod, sub_ids });
        }
        EventSubCmd::Remove { broadcaster_id } => {
            let Some(sub) = subs.remove(&broadcaster_id) else { return };
            let Ok(tok) = get_token(app).await else { return };
            for sid in sub.sub_ids {
                let _ = delete_subscription(helix, &tok, &sid).await;
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
