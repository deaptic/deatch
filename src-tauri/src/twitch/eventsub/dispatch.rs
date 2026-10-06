use std::collections::HashMap;

use futures_util::StreamExt;
use twitch_api::eventsub::{Event, EventsubWebsocketData};

use super::super::Twitch;
use super::envelope::EventEnvelope;
use super::runner::ChannelSub;
use super::subscribe::create_subscription;
use super::EventKind;
use crate::emit::emit_named;
use crate::error::Result;

/// Forwards an EventSub notification to the frontend wrapped in
/// `EventEnvelope { timestamp, event }` if the broadcaster is one we care
/// about. The envelope is uniform across every event kind so the renderer
/// can read `timestamp` without per-event special casing.
macro_rules! forward {
    ($app:expr, $subs:expr, $notif:expr, $kind:expr, $timestamp:expr) => {
        if let twitch_api::eventsub::Message::Notification(msg) = $notif.message {
            if $subs.contains_key(msg.broadcaster_user_id.as_str()) {
                emit_named(
                    $app,
                    $kind.event_name(),
                    EventEnvelope::new($timestamp, msg),
                );
            }
        }
    };
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
        Event::ChannelChatSettingsUpdateV1(n) => {
            forward!(
                app,
                subs,
                n,
                EventKind::ChannelChatSettingsUpdate,
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
        Event::ChannelUpdateV2(n) => forward!(app, subs, n, EventKind::ChannelUpdate, timestamp),
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

    let results: Vec<(EventKind, String, Option<String>)> = futures_util::stream::iter(work)
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

/// Fallback for notifications `twitch_api` can't parse. Twitch keeps adding
/// variants the crate doesn't know yet (new chat fragment types like `gif`,
/// `channel.chat.notification` notice types, `channel.moderate` actions), and
/// the crate rejects the whole message when any part is unknown. The frontend
/// types are hand-written and tolerant, so we forward the raw event instead of
/// dropping it.
fn forward_unparsed(
    app: &tauri::AppHandle,
    subs: &HashMap<String, ChannelSub>,
    text: &str,
    parse_err: impl std::fmt::Display,
) {
    let Some(notification) = unparsed_notification(text) else {
        log::warn!("parse_websocket skipped: {parse_err}\n  raw: {text}");
        return;
    };
    log::debug!("forwarding unparsed {:?}: {parse_err}", notification.kind);
    if subs.contains_key(&notification.broadcaster_id) {
        emit_named(
            app,
            notification.kind.event_name(),
            EventEnvelope::new(notification.timestamp, notification.event),
        );
    }
}

struct UnparsedNotification {
    kind: EventKind,
    broadcaster_id: String,
    timestamp: String,
    event: serde_json::Value,
}

fn unparsed_notification(text: &str) -> Option<UnparsedNotification> {
    let mut value = serde_json::from_str::<serde_json::Value>(text).ok()?;
    let str_at = |pointer: &str| value.pointer(pointer).and_then(|v| v.as_str());
    if str_at("/metadata/message_type")? != "notification" {
        return None;
    }
    let kind =
        serde_json::from_value::<EventKind>(value.pointer("/metadata/subscription_type")?.clone())
            .ok()?;
    let timestamp = str_at("/metadata/message_timestamp")
        .unwrap_or("")
        .to_string();
    let event = value.pointer_mut("/payload/event")?.take();
    let broadcaster_id = event.get("broadcaster_user_id")?.as_str()?.to_string();
    Some(UnparsedNotification {
        kind,
        broadcaster_id,
        timestamp,
        event,
    })
}

#[cfg(test)]
mod tests {
    use super::unparsed_notification;
    use crate::twitch::eventsub::EventKind;

    // Trimmed from a real channel.chat.message that twitch_api 0.8 rejects
    // because of the `gif` fragment type.
    const GIF_MESSAGE: &str = r#"{
        "metadata": {
            "message_id": "QFCMTLyqOT1ZTW-6A9IMEfZuG6KQgRyogpr0kU7zttE=",
            "message_type": "notification",
            "message_timestamp": "2026-09-30T20:39:40.240392291Z",
            "subscription_type": "channel.chat.message",
            "subscription_version": "1"
        },
        "payload": {
            "subscription": { "id": "0c2f", "type": "channel.chat.message", "version": "1" },
            "event": {
                "broadcaster_user_id": "79615025",
                "chatter_user_id": "1071073319",
                "chatter_user_login": "gardenofeden701",
                "message_id": "beae673d",
                "message": {
                    "text": "[Amy Poehler Hello GIF by Team Coco]",
                    "fragments": [{
                        "type": "gif",
                        "text": "[Amy Poehler Hello GIF by Team Coco]",
                        "gif": { "id": "WpIPS0DWNpMm4kfMVr", "url": "https://media0.giphy.com/x.gif" }
                    }]
                },
                "message_type": "text"
            }
        }
    }"#;

    #[test]
    fn twitch_api_still_rejects_the_gif_fragment() {
        assert!(twitch_api::eventsub::Event::parse_websocket(GIF_MESSAGE).is_err());
    }

    #[test]
    fn extracts_unparsed_chat_messages() {
        let n = unparsed_notification(GIF_MESSAGE).expect("forwarded");
        assert_eq!(n.kind, EventKind::ChannelChatMessage);
        assert_eq!(n.broadcaster_id, "79615025");
        assert_eq!(n.timestamp, "2026-09-30T20:39:40.240392291Z");
        assert_eq!(n.event["message"]["fragments"][0]["type"], "gif");
    }

    #[test]
    fn skips_non_notifications_and_unknown_subscriptions() {
        let keepalive = GIF_MESSAGE.replace("\"notification\"", "\"session_keepalive\"");
        let unknown = GIF_MESSAGE.replace(
            "\"subscription_type\": \"channel.chat.message\"",
            "\"subscription_type\": \"channel.brand.new\"",
        );
        assert!(unparsed_notification(&keepalive).is_none());
        assert!(unparsed_notification(&unknown).is_none());
        assert!(unparsed_notification("not json").is_none());
    }
}
