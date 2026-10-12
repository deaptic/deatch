use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tauri::async_runtime::JoinHandle;
use tokio::net::TcpStream;
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message as WsMessage;
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};

use super::runner::Signal;
use super::subscriptions::ConnId;
use super::EventKind;
use crate::twitch::ids::UserId;

const WS_URL: &str = "wss://eventsub.wss.twitch.tv/ws";
/// Twitch sends a keepalive every 10s by default; silence beyond this means
/// the socket is half-open and must be replaced.
const KEEPALIVE_TIMEOUT: Duration = Duration::from_secs(30);
const MIGRATION_GRACE: Duration = Duration::from_secs(30);
const RECONNECT_BASE: Duration = Duration::from_secs(1);
const RECONNECT_MAX: Duration = Duration::from_secs(60);

type Socket = WebSocketStream<MaybeTlsStream<TcpStream>>;

enum End {
    Migrate(String),
    Lost,
    Stopped,
}

#[derive(Debug, PartialEq)]
enum Received {
    Welcome(String),
    Reconnect(String),
    Notification(Notification),
    Revocation { sub_id: String, reason: String },
    Other,
}

/// Serializes as the `{ timestamp, event }` envelope the frontend listens for.
#[derive(Debug, PartialEq, Clone, Serialize)]
pub(super) struct Notification {
    #[serde(skip)]
    pub(super) kind: EventKind,
    #[serde(skip)]
    pub(super) broadcaster_id: UserId,
    pub(super) timestamp: String,
    pub(super) event: serde_json::Value,
}

pub(super) fn spawn(conn: ConnId, signals: mpsc::UnboundedSender<Signal>) -> JoinHandle<()> {
    tauri::async_runtime::spawn(run(conn, signals))
}

async fn run(conn: ConnId, signals: mpsc::UnboundedSender<Signal>) {
    let mut url = WS_URL.to_string();
    let mut down_reported = false;
    let mut failed_connects = 0;
    loop {
        let end = match connect_async(url.as_str()).await {
            Ok((socket, _)) => {
                serve(
                    conn,
                    socket,
                    &signals,
                    &mut down_reported,
                    &mut failed_connects,
                )
                .await
            }
            Err(e) => {
                log::warn!("eventsub[{conn}] connect failed: {e}");
                End::Lost
            }
        };
        match end {
            End::Migrate(next) => {
                log::info!("eventsub[{conn}] migrating session");
                url = next;
                continue;
            }
            End::Stopped => return,
            End::Lost => {}
        }
        if !std::mem::replace(&mut down_reported, true)
            && signals.send(Signal::Down { conn }).is_err()
        {
            return;
        }
        url = WS_URL.to_string();
        let delay = jittered(reconnect_delay(failed_connects));
        failed_connects += 1;
        log::info!("eventsub[{conn}] reconnecting in {delay:?}");
        tokio::time::sleep(delay).await;
    }
}

async fn serve(
    conn: ConnId,
    mut socket: Socket,
    signals: &mpsc::UnboundedSender<Signal>,
    down_reported: &mut bool,
    failed_connects: &mut u32,
) -> End {
    loop {
        let text = match tokio::time::timeout(KEEPALIVE_TIMEOUT, socket.next()).await {
            Ok(Some(Ok(WsMessage::Text(text)))) => text,
            Ok(Some(Ok(WsMessage::Close(frame)))) => {
                log::info!("eventsub[{conn}] closed by server: {frame:?}");
                return End::Lost;
            }
            Ok(Some(Ok(_))) => {
                if let Err(e) = socket.flush().await {
                    log::warn!("eventsub[{conn}] pong failed: {e}");
                }
                continue;
            }
            Ok(Some(Err(e))) => {
                log::warn!("eventsub[{conn}] socket error: {e}");
                return End::Lost;
            }
            Ok(None) => {
                log::info!("eventsub[{conn}] socket ended");
                return End::Lost;
            }
            Err(_) => {
                log::info!("eventsub[{conn}] no keepalive for {KEEPALIVE_TIMEOUT:?}");
                return End::Lost;
            }
        };
        let signal = match classify(&text) {
            Ok(Received::Welcome(session_id)) => {
                log::info!("eventsub[{conn}] session {session_id}");
                *down_reported = false;
                *failed_connects = 0;
                Signal::Up { conn, session_id }
            }
            Ok(Received::Reconnect(url)) => {
                tauri::async_runtime::spawn(drain(conn, socket, signals.clone()));
                return End::Migrate(url);
            }
            Ok(Received::Notification(notification)) => Signal::Notification(notification),
            Ok(Received::Revocation { sub_id, reason }) => {
                log::warn!("eventsub[{conn}] subscription {sub_id} revoked: {reason}");
                Signal::Revoked(sub_id)
            }
            Ok(Received::Other) => continue,
            Err(e) => {
                log::warn!("eventsub[{conn}] unreadable frame: {e}\n  raw: {text}");
                continue;
            }
        };
        if signals.send(signal).is_err() {
            return End::Stopped;
        }
    }
}

/// Twitch keeps delivering to the old session until the new one is
/// welcomed, so it is read until it ends or the migration window closes.
async fn drain(conn: ConnId, mut socket: Socket, signals: mpsc::UnboundedSender<Signal>) {
    let forward = async {
        while let Some(message) = socket.next().await {
            let Ok(WsMessage::Text(text)) = message else {
                continue;
            };
            if let Ok(Received::Notification(notification)) = classify(&text) {
                if signals.send(Signal::Notification(notification)).is_err() {
                    return;
                }
            }
        }
    };
    if tokio::time::timeout(MIGRATION_GRACE, forward)
        .await
        .is_err()
    {
        log::info!("eventsub[{conn}] old session still open after migration, dropping it");
    }
}

#[derive(Deserialize)]
struct Frame {
    metadata: Metadata,
    #[serde(default)]
    payload: Payload,
}

#[derive(Deserialize)]
struct Metadata {
    message_type: String,
    #[serde(default)]
    message_timestamp: String,
    subscription_type: Option<EventKind>,
}

#[derive(Deserialize, Default)]
struct Payload {
    session: Option<Session>,
    subscription: Option<RevokedSubscription>,
    event: Option<serde_json::Value>,
}

#[derive(Deserialize)]
struct RevokedSubscription {
    #[serde(default)]
    id: String,
    #[serde(default)]
    status: String,
}

#[derive(Deserialize)]
struct Session {
    id: String,
    reconnect_url: Option<String>,
}

/// Events are read as raw JSON, not `twitch_api` types: Twitch keeps adding
/// fields the crate rejects (new chat fragment types, notice types), and the
/// frontend's hand-written types already describe the raw shape.
fn classify(text: &str) -> serde_json::Result<Received> {
    let Frame { metadata, payload } = serde_json::from_str(text)?;
    Ok(match metadata.message_type.as_str() {
        "session_welcome" => payload
            .session
            .map_or(Received::Other, |session| Received::Welcome(session.id)),
        "session_reconnect" => payload
            .session
            .and_then(|session| session.reconnect_url)
            .map_or(Received::Other, Received::Reconnect),
        "notification" => {
            notification(metadata, payload.event).map_or(Received::Other, Received::Notification)
        }
        "revocation" => payload
            .subscription
            .map_or(Received::Other, |s| Received::Revocation {
                sub_id: s.id,
                reason: s.status,
            }),
        _ => Received::Other,
    })
}

fn notification(metadata: Metadata, event: Option<serde_json::Value>) -> Option<Notification> {
    let event = event?;
    let broadcaster_id = UserId::from(event.get("broadcaster_user_id")?.as_str()?);
    Some(Notification {
        kind: metadata.subscription_type?,
        broadcaster_id,
        timestamp: metadata.message_timestamp,
        event,
    })
}

fn reconnect_delay(failed_connects: u32) -> Duration {
    RECONNECT_BASE
        .saturating_mul(2u32.saturating_pow(failed_connects))
        .min(RECONNECT_MAX)
}

/// Adds up to 25% so many clients dropped together don't reconnect in step.
fn jittered(delay: Duration) -> Duration {
    let spread = crate::clock::since_epoch().subsec_nanos() % 1000;
    delay + delay.mul_f64(f64::from(spread) / 4000.0)
}

#[cfg(test)]
mod tests {
    use super::*;

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
                "message": {
                    "text": "[Amy Poehler Hello GIF by Team Coco]",
                    "fragments": [{
                        "type": "gif",
                        "text": "[Amy Poehler Hello GIF by Team Coco]",
                        "gif": { "id": "WpIPS0DWNpMm4kfMVr" }
                    }]
                }
            }
        }
    }"#;

    #[test]
    fn classifies_session_frames() {
        let welcome = r#"{"metadata":{"message_type":"session_welcome"},"payload":{"session":{"id":"abc","reconnect_url":null}}}"#;
        let reconnect = r#"{"metadata":{"message_type":"session_reconnect"},"payload":{"session":{"id":"abc","reconnect_url":"wss://x"}}}"#;
        let keepalive = r#"{"metadata":{"message_type":"session_keepalive"},"payload":{}}"#;
        assert_eq!(classify(welcome).unwrap(), Received::Welcome("abc".into()));
        assert_eq!(
            classify(reconnect).unwrap(),
            Received::Reconnect("wss://x".into())
        );
        let revocation = r#"{"metadata":{"message_type":"revocation"},"payload":{"subscription":{"id":"sub1","status":"moderator_removed"}}}"#;
        assert_eq!(classify(keepalive).unwrap(), Received::Other);
        assert_eq!(
            classify(revocation).unwrap(),
            Received::Revocation {
                sub_id: "sub1".into(),
                reason: "moderator_removed".into(),
            }
        );
        assert!(classify("garbage").is_err());
    }

    #[test]
    fn forwards_events_twitch_api_cannot_parse() {
        assert!(twitch_api::eventsub::Event::parse_websocket(GIF_MESSAGE).is_err());
        let Received::Notification(n) = classify(GIF_MESSAGE).unwrap() else {
            panic!("expected a notification");
        };
        assert_eq!(n.kind, EventKind::ChannelChatMessage);
        assert_eq!(n.broadcaster_id, UserId::from("79615025"));
        assert_eq!(n.timestamp, "2026-09-30T20:39:40.240392291Z");
        assert_eq!(n.event["message"]["fragments"][0]["type"], "gif");
    }

    #[test]
    fn reconnect_delay_doubles_up_to_the_cap() {
        assert_eq!(reconnect_delay(0), Duration::from_secs(1));
        assert_eq!(reconnect_delay(3), Duration::from_secs(8));
        assert_eq!(reconnect_delay(7), RECONNECT_MAX);
        assert_eq!(reconnect_delay(u32::MAX), RECONNECT_MAX);
    }

    #[test]
    fn jitter_adds_at_most_a_quarter() {
        let base = Duration::from_secs(4);
        let delay = jittered(base);
        assert!(delay >= base && delay <= base + Duration::from_secs(1));
    }
}
