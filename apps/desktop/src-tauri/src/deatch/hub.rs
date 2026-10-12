use std::time::Duration;

use futures_util::stream::SplitSink;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use serde_json::Value;
use tauri::Manager;
use tokio::net::TcpStream;
use tokio::sync::mpsc::error::SendError;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::{Error as WsError, Message};
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};

use super::events::DeatchConnection;
use super::presence::{self, Presence};
use super::BASE_URL;
use crate::emit::emit;
use crate::twitch::Twitch;

const PATH: &str = "/api/v1/ws";
const RECONNECT_DELAY: Duration = Duration::from_secs(5);
const PING_INTERVAL: Duration = Duration::from_secs(30);
const READ_TIMEOUT: Duration = Duration::from_secs(90);

type Writer = SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>;

#[derive(Debug)]
pub enum Op {
    Connect,
    Disconnect,
    Watch(Vec<String>),
}

pub struct HubClient(UnboundedSender<Op>);

impl HubClient {
    pub fn request(&self, op: Op) {
        if let Err(SendError(op)) = self.0.send(op) {
            log::error!("hub task stopped, dropped {op:?}");
        }
    }
}

pub fn spawn(app: tauri::AppHandle, twitch: Twitch) {
    let (tx, rx) = unbounded_channel();
    app.manage(HubClient(tx));
    tauri::async_runtime::spawn(run(app, twitch, rx));
}

enum End {
    Lost,
    Stopped,
    Ended,
}

async fn run(app: tauri::AppHandle, twitch: Twitch, mut rx: UnboundedReceiver<Op>) {
    let mut presence = Presence::default();
    loop {
        match rx.recv().await {
            Some(Op::Connect) => {}
            Some(Op::Watch(ids)) => {
                presence.watch(ids);
                continue;
            }
            Some(Op::Disconnect) => continue,
            None => return,
        }
        let outcome = loop {
            match connect(&twitch).await {
                Ok(socket) => match serve(&app, socket, &mut rx, &mut presence).await {
                    End::Lost => emit(&app, DeatchConnection { connected: false }),
                    end => break end,
                },
                Err(e) => {
                    log::warn!("hub connect failed: {e}");
                    emit(&app, DeatchConnection { connected: false });
                }
            }
            tokio::time::sleep(RECONNECT_DELAY).await;
        };
        presence = Presence::default();
        emit(&app, DeatchConnection { connected: false });
        if let End::Ended = outcome {
            return;
        }
    }
}

async fn connect(
    twitch: &Twitch,
) -> crate::error::Result<WebSocketStream<MaybeTlsStream<TcpStream>>> {
    let authed = twitch.authed().await?;
    let url = format!("{}{PATH}", BASE_URL.replacen("http", "ws", 1));
    let mut request = url.into_client_request()?;
    request.headers_mut().insert(
        "Authorization",
        format!("Bearer {}", authed.token.access_token.secret()).parse()?,
    );
    let (socket, _) = connect_async(request).await?;
    Ok(socket)
}

async fn serve(
    app: &tauri::AppHandle,
    socket: WebSocketStream<MaybeTlsStream<TcpStream>>,
    rx: &mut UnboundedReceiver<Op>,
    presence: &mut Presence,
) -> End {
    log::info!("hub connected");
    emit(app, DeatchConnection { connected: true });
    let (mut write, mut read) = socket.split();
    if send_all(&mut write, presence.resubscribe()).await.is_err() {
        return End::Lost;
    }
    let mut ping = tokio::time::interval(PING_INTERVAL);
    ping.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
    loop {
        tokio::select! {
            op = rx.recv() => match op {
                Some(Op::Watch(ids)) => {
                    if send_all(&mut write, presence.watch(ids)).await.is_err() {
                        return End::Lost;
                    }
                }
                Some(Op::Disconnect) => return End::Stopped,
                Some(Op::Connect) => {}
                None => return End::Ended,
            },
            _ = ping.tick() => {
                if write.send(Message::Text("ping".into())).await.is_err() {
                    return End::Lost;
                }
            }
            message = tokio::time::timeout(READ_TIMEOUT, read.next()) => match message {
                Ok(Some(Ok(Message::Text(text)))) => dispatch(app, &text),
                Ok(Some(Ok(Message::Close(frame)))) => {
                    log::info!("hub closed by server: {frame:?}");
                    return End::Lost;
                }
                Ok(Some(Ok(_))) => {}
                Ok(Some(Err(e))) => {
                    log::warn!("hub socket error: {e}");
                    return End::Lost;
                }
                Ok(None) => {
                    log::info!("hub socket ended");
                    return End::Lost;
                }
                Err(_) => {
                    log::warn!("hub silent for {READ_TIMEOUT:?}, reconnecting");
                    return End::Lost;
                }
            }
        }
    }
}

async fn send_all(write: &mut Writer, messages: Vec<Value>) -> Result<(), WsError> {
    for message in messages {
        write
            .send(Message::Text(message.to_string().into()))
            .await
            .inspect_err(|e| log::warn!("hub send failed: {e}"))?;
    }
    Ok(())
}

#[derive(Deserialize)]
struct Envelope {
    feature: String,
    #[serde(flatten)]
    body: Value,
}

fn dispatch(app: &tauri::AppHandle, text: &str) {
    let Ok(Envelope { feature, body }) = serde_json::from_str::<Envelope>(text) else {
        return;
    };
    match feature.as_str() {
        presence::FEATURE => {
            if let Some(update) = presence::parse(body) {
                emit(app, update);
            }
        }
        other => log::debug!("hub message for unknown feature {other}"),
    }
}
