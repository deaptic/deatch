use std::collections::HashMap;

use futures_util::StreamExt;
use serde::Serialize;
use tauri::Emitter;
use twitch_api::eventsub::{Event, EventsubWebsocketData};

use super::super::Twitch;
use super::envelope::EventEnvelope;
use super::runner::ChannelSub;
use super::subscribe::create_subscription;
use super::EventKind;
use crate::error::Result;

/// Forwards an EventSub notification to the frontend wrapped in
/// `EventEnvelope { timestamp, event }` if the broadcaster is one we care
/// about. The envelope is uniform across every event kind so the renderer
/// can read `timestamp` without per-event special casing.
macro_rules! forward {
    ($app:expr, $subs:expr, $notif:expr, $kind:expr, $timestamp:expr) => {
        if let twitch_api::eventsub::Message::Notification(msg) = $notif.message {
            if $subs.contains_key(msg.broadcaster_user_id.as_str()) {
                emit_notification($app, $kind, EventEnvelope::new($timestamp, msg));
            }
        }
    };
}

fn emit_notification<T: Serialize + Clone>(
    app: &tauri::AppHandle,
    kind: EventKind,
    envelope: EventEnvelope<T>,
) {
    if let Err(e) = app.emit(kind.event_name(), envelope) {
        log::error!("emit {} failed: {e}", kind.event_name());
    }
}

pub(super) async fn handle_ws_message(
    app: &tauri::AppHandle,
    twitch: &Twitch,
    subs: &mut HashMap<String, ChannelSub>,
    session_id: &mut Option<String>,
    text: &str,
    quiet: bool,
) -> Result<Option<String>> {
    let event = match Event::parse_websocket(text) {
        Ok(e) => e,
        Err(e) => {
            forward_unparsed(app, subs, text, e);
            return Ok(None);
        }
    };
    match event {
        EventsubWebsocketData::Welcome { payload, .. } => {
            let sid = payload.session.id.to_string();
            *session_id = Some(sid.clone());
            resubscribe_pending(app, twitch, subs, &sid, quiet).await?;
            Ok(None)
        }
        EventsubWebsocketData::Notification {
            payload, metadata, ..
        } => {
            dispatch_notification(app, subs, payload, &metadata.message_timestamp.to_string());
            Ok(None)
        }
        EventsubWebsocketData::Reconnect { payload, .. } => {
            Ok(payload.session.reconnect_url.map(|u| u.to_string()))
        }
        _ => Ok(None),
    }
}

fn dispatch_notification(
    app: &tauri::AppHandle,
    subs: &HashMap<String, ChannelSub>,
    payload: Event,
    timestamp: &str,
) {
    match payload {
        Event::ChannelChatMessageV1(n) => {
            forward!(app, subs, n, EventKind::ChannelChatMessage, timestamp)
        }
        Event::ChannelChatNotificationV1(n) => {
            forward!(app, subs, n, EventKind::ChannelChatNotification, timestamp)
        }
        Event::ChannelChatMessageDeleteV1(n) => {
            forward!(app, subs, n, EventKind::ChannelChatMessageDelete, timestamp)
        }
        Event::ChannelChatClearV1(n) => {
            forward!(app, subs, n, EventKind::ChannelChatClear, timestamp)
        }
        Event::ChannelChatClearUserMessagesV1(n) => {
            forward!(
                app,
                subs,
                n,
                EventKind::ChannelChatClearUserMessages,
                timestamp
            )
        }
        Event::ChannelShoutoutCreateV1(n) => {
            forward!(app, subs, n, EventKind::ChannelShoutoutCreate, timestamp)
        }
        Event::ChannelFollowV2(n) => forward!(app, subs, n, EventKind::ChannelFollow, timestamp),
        Event::ChannelModerateV2(n) => {
            forward!(app, subs, n, EventKind::ChannelModerate, timestamp)
        }
        Event::AutomodMessageHoldV2(n) => {
            forward!(app, subs, n, EventKind::AutomodMessageHold, timestamp)
        }
        Event::AutomodMessageUpdateV2(n) => {
            forward!(app, subs, n, EventKind::AutomodMessageUpdate, timestamp)
        }
        Event::ChannelPointsCustomRewardRedemptionAddV1(n) => forward!(
            app,
            subs,
            n,
            EventKind::ChannelPointsCustomRewardRedemptionAdd,
            timestamp
        ),
        _ => {}
    }
}

async fn resubscribe_pending(
    app: &tauri::AppHandle,
    twitch: &Twitch,
    subs: &mut HashMap<String, ChannelSub>,
    sid: &str,
    quiet: bool,
) -> Result<()> {
    let has_pending = subs
        .values()
        .any(|s| s.requested.iter().any(|k| !s.sub_ids.contains_key(k)));
    if !has_pending {
        return Ok(());
    }
    let authed = twitch.authed().await?;
    let authed = &authed;

    // Build the work queue in `EventKind::ALL` order so every channel's
    // chat.message HTTP call starts before any other-kind call —
    // `requested` is a HashSet, so this outer loop is what guarantees ordering.
    const MAX_CONCURRENT: usize = 20;
    let mut work: Vec<(EventKind, String)> = Vec::new();
    for kind in EventKind::ALL {
        for (broadcaster_id, sub) in subs.iter() {
            if sub.requested.contains(&kind) && !sub.sub_ids.contains_key(&kind) {
                work.push((kind, broadcaster_id.clone()));
            }
        }
    }

    let results: Vec<(EventKind, String, Option<String>)> =
        futures_util::stream::iter(work.into_iter())
            .map(|item| async move {
                let (kind, b) = item;
                let id = create_subscription(app, authed, &b, kind, sid, quiet).await;
                (kind, b, id)
            })
            .buffer_unordered(MAX_CONCURRENT)
            .collect()
            .await;

    for (kind, broadcaster_id, id) in results {
        if let Some(id) = id {
            if let Some(sub) = subs.get_mut(&broadcaster_id) {
                sub.sub_ids.insert(kind, id);
            }
        }
    }
    Ok(())
}

/// Fallback for messages `twitch_api` can't parse — typically newer
/// `channel.chat.notification` variants (watch_streak, modiversary) or
/// `channel.moderate` action additions. We pluck the inner event JSON
/// straight from the payload and forward it wrapped in the same envelope.
fn forward_unparsed(
    app: &tauri::AppHandle,
    subs: &HashMap<String, ChannelSub>,
    text: &str,
    parse_err: impl std::fmt::Display,
) {
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(text) {
        let kind = value
            .pointer("/metadata/subscription_type")
            .and_then(|v| serde_json::from_value::<EventKind>(v.clone()).ok());
        let evt = value.pointer("/payload/event");
        let timestamp = value
            .pointer("/metadata/message_timestamp")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        if let (
            Some(kind @ (EventKind::ChannelChatNotification | EventKind::ChannelModerate)),
            Some(evt),
        ) = (kind, evt)
        {
            let broadcaster = evt
                .get("broadcaster_user_id")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            if subs.contains_key(broadcaster) {
                emit_notification(app, kind, EventEnvelope::new(timestamp, evt.clone()));
            }
            return;
        }
    }
    log::warn!("parse_websocket skipped: {parse_err}\n  raw: {text}");
}
