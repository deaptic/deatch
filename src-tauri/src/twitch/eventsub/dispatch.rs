use std::collections::HashMap;

use tauri::Emitter;
use twitch_api::eventsub::{Event, EventsubWebsocketData};

use super::runner::ChannelSub;
use super::subscribe::create_subscriptions;
use crate::twitch::get_token;

/// Forwards an EventSub notification to the frontend if the broadcaster is one
/// we care about. All chat events follow the same shape, so a macro avoids
/// repeating the message-unwrap / subs-lookup / emit dance for each variant.
macro_rules! forward {
    ($app:expr, $subs:expr, $notif:expr, $event_name:literal) => {
        if let twitch_api::eventsub::Message::Notification(msg) = $notif.message {
            if $subs.contains_key(msg.broadcaster_user_id.as_str()) {
                let _ = $app.emit($event_name, msg);
            }
        }
    };
}

pub(super) async fn handle_ws_message(
    app: &tauri::AppHandle,
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    subs: &mut HashMap<String, ChannelSub>,
    session_id: &mut Option<String>,
    text: &str,
) -> Result<Option<String>, String> {
    let event = match Event::parse_websocket(text) {
        Ok(e) => e,
        Err(e) => return forward_unparsed(app, subs, text, e),
    };
    match event {
        EventsubWebsocketData::Welcome { payload, .. } => {
            let sid = payload.session.id.to_string();
            *session_id = Some(sid.clone());
            resubscribe_pending(app, helix, subs, &sid).await?;
            Ok(None)
        }
        EventsubWebsocketData::Notification { payload, metadata, .. } => {
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
    message_timestamp: &str,
) {
    match payload {
        Event::ChannelChatMessageV1(n) => forward!(app, subs, n, "channel-chat-message"),
        Event::ChannelChatNotificationV1(n) => forward!(app, subs, n, "channel-chat-notification"),
        Event::ChannelChatMessageDeleteV1(n) => forward!(app, subs, n, "channel-chat-message-delete"),
        Event::ChannelChatClearV1(n) => forward!(app, subs, n, "channel-chat-clear"),
        Event::ChannelChatClearUserMessagesV1(n) => forward!(app, subs, n, "channel-chat-clear-user-messages"),
        Event::ChannelShoutoutCreateV1(n) => forward!(app, subs, n, "channel-shoutout-create"),
        Event::ChannelFollowV2(n) => forward!(app, subs, n, "channel-follow"),
        Event::ChannelModerateV2(n) => {
            if let twitch_api::eventsub::Message::Notification(msg) = n.message {
                if subs.contains_key(msg.broadcaster_user_id.as_str()) {
                    let _ = app.emit(
                        "channel-moderate",
                        serde_json::json!({
                            "message_timestamp": message_timestamp,
                            "event": msg,
                        }),
                    );
                }
            }
        }
        _ => {}
    }
}

async fn resubscribe_pending(
    app: &tauri::AppHandle,
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    subs: &mut HashMap<String, ChannelSub>,
    sid: &str,
) -> Result<(), String> {
    // Subscribe channels missing sub_ids. Channels with existing IDs were
    // migrated by Twitch via the reconnect URL and remain valid.
    if !subs.values().any(|s| s.sub_ids.is_empty()) {
        return Ok(());
    }
    let token = get_token(app).await?;
    for (broadcaster_id, sub) in subs.iter_mut() {
        if !sub.sub_ids.is_empty() {
            continue;
        }
        sub.sub_ids = create_subscriptions(app, helix, &token, broadcaster_id, sub.is_mod, sid).await;
    }
    Ok(())
}

/// Fallback for messages `twitch_api` can't parse — typically newer
/// `channel.chat.notification` variants (watch_streak, modiversary) or
/// `channel.moderate` action additions. We pluck the inner event JSON
/// straight from the payload and forward it; the frontend tolerates
/// unknown subtypes.
fn forward_unparsed(
    app: &tauri::AppHandle,
    subs: &HashMap<String, ChannelSub>,
    text: &str,
    parse_err: impl std::fmt::Display,
) -> Result<Option<String>, String> {
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(text) {
        let sub_type = value.pointer("/metadata/subscription_type").and_then(|v| v.as_str());
        let evt = value.pointer("/payload/event");

        if let (Some(kind), Some(evt)) = (sub_type, evt) {
            let broadcaster = evt
                .get("broadcaster_user_id")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let subscribed = subs.contains_key(broadcaster);
            match kind {
                "channel.chat.notification" => {
                    if subscribed {
                        let _ = app.emit("channel-chat-notification", evt);
                    }
                    return Ok(None);
                }
                "channel.moderate" => {
                    if subscribed {
                        let ts = value
                            .pointer("/metadata/message_timestamp")
                            .and_then(|v| v.as_str())
                            .unwrap_or("");
                        let _ = app.emit(
                            "channel-moderate",
                            serde_json::json!({
                                "message_timestamp": ts,
                                "event": evt,
                            }),
                        );
                    }
                    return Ok(None);
                }
                _ => {}
            }
        }
    }
    eprintln!("[eventsub] parse_websocket skipped: {parse_err}\n  raw: {text}");
    Ok(None)
}
