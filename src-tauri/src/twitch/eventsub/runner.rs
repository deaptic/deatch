use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::Message as WsMessage};

use twitch_api::twitch_oauth2::UserToken;

use super::super::moderation::get_moderated_channels;
use super::super::Twitch;
use super::dispatch::handle_ws_message;
use super::events::{EventSubConnection, EventSubFailed, EventSubRecovered, SubscriptionStatus};
use super::subscribe::{create_subscription, delete_subscription, emit_failed, emit_status};
use super::{EventKind, EventSubCmd, WS_URL};
use crate::emit::emit;
use crate::error::{Error, Result};
use crate::twitch::ids::UserId;

pub(super) struct ChannelSub {
    pub(super) is_mod: bool,
    /// Survives reconnects so `resubscribe_pending` can recreate them.
    pub(super) requested: HashSet<EventKind>,
    /// Cleared on fresh reconnect; preserved on Twitch-initiated session migration.
    pub(super) sub_ids: HashMap<EventKind, String>,
}

pub(super) async fn ensure_task(app: &tauri::AppHandle, twitch: &Twitch) -> Result<()> {
    // Hold the init mutex for the entire setup so concurrent callers wait
    // here instead of racing through their own auth checks and clobbering
    // each other's tx slots. By the time we drop the guard, either a task
    // is running and the tx slot is committed, or initialization failed and
    // the slot is empty — concurrent callers re-check after acquiring.
    let _init_guard = twitch.eventsub.init.lock().await;

    if twitch.eventsub.tx.lock().unwrap().is_some() {
        return Ok(());
    }

    // Verify auth before committing to a task — failure leaves the slot
    // empty so the next caller can retry.
    let authed = twitch.authed().await?;

    // Refreshes the moderated_channel_ids cache so handle_cmd can read it
    // synchronously when deciding is_mod. Non-fatal — is_mod defaults to
    // false until the next refresh.
    match get_moderated_channels(&authed).await {
        Ok(channels) => twitch.cache_moderated_channel_ids(&channels),
        Err(e) => emit(app, EventSubFailed(e)),
    }

    let (tx, rx) = mpsc::unbounded_channel();
    *twitch.eventsub.tx.lock().unwrap() = Some(tx);

    let app = app.clone();
    let twitch = twitch.clone();
    tauri::async_runtime::spawn(async move {
        run(&app, &twitch, rx).await;
        // Clear the tx so the next subscribe call respawns the task.
        twitch.eventsub.stop();
    });
    Ok(())
}

/// Twitch sends a keepalive every 10s by default; silence beyond this means
/// the socket is half-open and must be replaced.
const KEEPALIVE_TIMEOUT: Duration = Duration::from_secs(30);
/// Drops shorter than this are recovered silently; longer ones surface as
/// disconnect/connect notices in the feed.
const NOTICE_GRACE: Duration = Duration::from_secs(10);

async fn run(
    app: &tauri::AppHandle,
    twitch: &Twitch,
    mut cmd_rx: mpsc::UnboundedReceiver<EventSubCmd>,
) {
    let mut url = WS_URL.to_string();
    let mut subs: HashMap<String, ChannelSub> = HashMap::new();
    let mut is_reconnect = false;
    let mut outage: Option<Outage> = None;
    let mut outage_notified = false;

    loop {
        if let Some(Outage { started, .. }) = outage {
            if !outage_notified && started.elapsed() >= NOTICE_GRACE {
                emit_disconnected(app, &subs);
                outage_notified = true;
            }
        }

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
                    Some(cmd) => handle_cmd(app, twitch, &mut subs, session_id.as_deref(), cmd).await,
                    None => return,
                },
                msg = tokio::time::timeout(KEEPALIVE_TIMEOUT, read.next()) => match msg {
                    Ok(Some(Ok(WsMessage::Text(text)))) => {
                        let quiet = outage.is_some() && !outage_notified;
                        let had_session = session_id.is_some();
                        match handle_ws_message(app, twitch, &mut subs, &mut session_id, &text, quiet).await {
                            Ok(Some(reconnect)) => { next_url = Some(reconnect); break; }
                            Err(e) => emit(app, EventSubFailed(e)),
                            _ => {}
                        }
                        if !had_session && session_id.is_some() {
                            emit(app, EventSubConnection { connected: true });
                            if let Some(o) = outage.take() {
                                println!("[eventsub] recovered after {:?} (quiet={quiet})", o.started.elapsed());
                                emit_recovered(app, &subs, o.since_unix_ms);
                            }
                            outage_notified = false;
                        }
                    }
                    Ok(Some(Ok(WsMessage::Close(frame)))) => {
                        println!("[eventsub] closed by server: {frame:?}");
                        break;
                    }
                    Ok(Some(Ok(_))) => {}
                    Ok(Some(Err(e))) => {
                        println!("[eventsub] socket error: {e}");
                        break;
                    }
                    Ok(None) => {
                        println!("[eventsub] socket ended");
                        break;
                    }
                    Err(_) => {
                        println!("[eventsub] no keepalive for {KEEPALIVE_TIMEOUT:?}, reconnecting");
                        break;
                    }
                }
            }
            let _ = write.flush().await;
        }

        is_reconnect = next_url.is_some();
        url = next_url.unwrap_or_else(|| WS_URL.to_string());
        if !is_reconnect {
            if outage.is_none() {
                emit(app, EventSubConnection { connected: false });
            }
            outage.get_or_insert_with(Outage::now);
            let delay = if outage_notified { 5 } else { 1 };
            tokio::time::sleep(Duration::from_secs(delay)).await;
        }
    }
}

struct Outage {
    started: Instant,
    since_unix_ms: u64,
}

impl Outage {
    fn now() -> Self {
        let since_unix_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        Self {
            started: Instant::now(),
            since_unix_ms,
        }
    }
}

/// Tells the frontend which chats may have missed messages while the socket
/// was down, so it can backfill the gap from recent-messages.
fn emit_recovered(app: &tauri::AppHandle, subs: &HashMap<String, ChannelSub>, since_unix_ms: u64) {
    let broadcaster_ids: Vec<UserId> = subs
        .iter()
        .filter(|(_, s)| s.requested.contains(&EventKind::ChannelChatMessage))
        .map(|(id, _)| UserId::from(id.as_str()))
        .collect();
    if broadcaster_ids.is_empty() {
        return;
    }
    emit(
        app,
        EventSubRecovered {
            since: since_unix_ms,
            broadcaster_ids,
        },
    );
}

fn emit_disconnected(app: &tauri::AppHandle, subs: &HashMap<String, ChannelSub>) {
    for (broadcaster_id, sub) in subs {
        for &kind in &sub.requested {
            println!("[eventsub] unsubscribed kind={kind:?} broadcaster={broadcaster_id} (ws disconnect)");
            emit_status(app, broadcaster_id, kind, SubscriptionStatus::Unsubscribed);
        }
    }
}
async fn handle_cmd(
    app: &tauri::AppHandle,
    twitch: &Twitch,
    subs: &mut HashMap<String, ChannelSub>,
    session_id: Option<&str>,
    cmd: EventSubCmd,
) {
    match cmd {
        EventSubCmd::Subscribe {
            broadcaster_id,
            kind,
        } => {
            let authed = match twitch.authed().await {
                Ok(a) => a,
                Err(e) => {
                    emit_failed(app, &broadcaster_id, kind, e);
                    return;
                }
            };

            let entry = subs
                .entry(broadcaster_id.clone())
                .or_insert_with(|| ChannelSub {
                    is_mod: is_mod_of(twitch, &authed.token, &broadcaster_id),
                    requested: HashSet::new(),
                    sub_ids: HashMap::new(),
                });

            if entry.requested.contains(&kind) {
                return;
            }

            if kind.requires_mod() && !entry.is_mod {
                emit_failed(
                    app,
                    &broadcaster_id,
                    kind,
                    Error::Invalid("not a moderator".into()),
                );
                if entry.requested.is_empty() && entry.sub_ids.is_empty() {
                    subs.remove(&broadcaster_id);
                }
                return;
            }

            entry.requested.insert(kind);

            // No session yet — Welcome handler will create the sub.
            let Some(sid) = session_id else { return };

            match create_subscription(app, &authed, &broadcaster_id, kind, sid, false).await {
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
        EventSubCmd::Unsubscribe {
            broadcaster_id,
            kind,
        } => {
            let Some(entry) = subs.get_mut(&broadcaster_id) else {
                return;
            };
            entry.requested.remove(&kind);
            if let Some(sub_id) = entry.sub_ids.remove(&kind) {
                println!("[eventsub] unsubscribe kind={kind:?} broadcaster={broadcaster_id}");
                match twitch.authed().await {
                    Ok(authed) => {
                        if let Err(e) = delete_subscription(&authed, &sub_id).await {
                            eprintln!(
                                "[eventsub] failed to delete subscription {sub_id}, leaked remotely: {e}"
                            );
                        }
                    }
                    Err(e) => eprintln!(
                        "[eventsub] no token to delete subscription {sub_id}, leaked remotely: {e}"
                    ),
                }
            }
            if entry.requested.is_empty() && entry.sub_ids.is_empty() {
                subs.remove(&broadcaster_id);
            }
        }
    }
}

fn is_mod_of(twitch: &Twitch, token: &UserToken, broadcaster_id: &str) -> bool {
    if broadcaster_id == token.user_id.as_str() {
        return true;
    }
    twitch
        .moderated_channel_ids
        .lock()
        .unwrap()
        .contains(broadcaster_id)
}
