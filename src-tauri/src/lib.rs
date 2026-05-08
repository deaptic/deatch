use futures_util::StreamExt;
use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tokio_tungstenite::{connect_async, tungstenite::Message as WsMessage};
use twitch_api::eventsub::{
    channel::chat::{ChannelChatMessageV1, ChannelChatNotificationV1},
    channel::{ChannelFollowV2, ChannelShoutoutCreateV1},
    Event, EventsubWebsocketData, Transport,
};
use twitch_api::twitch_oauth2::UserToken;

mod auth;
mod external;
mod twitch;

#[derive(serde::Serialize, Clone)]
pub(crate) struct UserInfo {
    user_id: String,
    login: String,
    display_name: String,
    profile_image_url: String,
}

pub(crate) struct AppState {
    pub(crate) token: Mutex<Option<UserToken>>,
    pub(crate) user_info: Mutex<Option<UserInfo>>,
    pub(crate) chat_stop: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

pub(crate) fn get_token(app: &tauri::AppHandle) -> Result<UserToken, String> {
    app.state::<AppState>()
        .token
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "Not authenticated".to_string())
}

pub(crate) fn helix() -> twitch_api::HelixClient<'static, reqwest::Client> {
    twitch_api::HelixClient::new()
}

#[tauri::command]
async fn start_chat(
    app: tauri::AppHandle,
    broadcaster_id: String,
    is_mod: bool,
) -> Result<(), String> {
    let old = app.state::<AppState>().chat_stop.lock().unwrap().take();
    if let Some(tx) = old {
        let _ = tx.send(());
    }

    let token = get_token(&app)?;

    let (stop_tx, stop_rx) = tokio::sync::oneshot::channel();
    *app.state::<AppState>().chat_stop.lock().unwrap() = Some(stop_tx);

    tauri::async_runtime::spawn(async move {
        if let Err(e) = run_chat(app.clone(), token, broadcaster_id, is_mod, stop_rx).await {
            let _ = app.emit("chat-error", e);
        }
    });

    Ok(())
}

async fn run_chat(
    app: tauri::AppHandle,
    token: UserToken,
    broadcaster_id: String,
    is_mod: bool,
    mut stop: tokio::sync::oneshot::Receiver<()>,
) -> Result<(), String> {
    let helix = helix();
    let mut url = "wss://eventsub.wss.twitch.tv/ws".to_string();

    loop {
        let Ok((ws, _)) = connect_async(url.as_str()).await else {
            url = "wss://eventsub.wss.twitch.tv/ws".to_string();
            tokio::select! { biased; _ = &mut stop => return Ok(()), _ = tokio::time::sleep(std::time::Duration::from_secs(5)) => {} }
            continue;
        };

        let (mut write, mut read) = ws.split();
        let mut next_url: Option<String> = None;

        loop {
            tokio::select! {
                biased;
                _ = &mut stop => return Ok(()),
                msg = read.next() => match msg {
                    Some(Ok(WsMessage::Text(text))) => {
                        match handle_ws_message(&app, &helix, &token, &broadcaster_id, is_mod, &text).await {
                            Ok(Some(reconnect)) => { next_url = Some(reconnect); break; }
                            Err(e) => { let _ = app.emit("chat-error", e); }
                            _ => {}
                        }
                    }
                    Some(Ok(_)) => {}
                    _ => break,
                }
            }
            let _ = futures_util::SinkExt::flush(&mut write).await;
        }

        let reconnecting = next_url.is_some();
        url = next_url.unwrap_or_else(|| "wss://eventsub.wss.twitch.tv/ws".to_string());
        if !reconnecting {
            tokio::select! { biased; _ = &mut stop => return Ok(()), _ = tokio::time::sleep(std::time::Duration::from_secs(3)) => {} }
        }
    }
}

async fn handle_ws_message(
    app: &tauri::AppHandle,
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    token: &UserToken,
    broadcaster_id: &str,
    is_mod: bool,
    text: &str,
) -> Result<Option<String>, String> {
    let event = Event::parse_websocket(text).map_err(|e| e.to_string())?;
    match event {
        EventsubWebsocketData::Welcome { payload, .. } => {
            subscribe_to_chat(helix, token, broadcaster_id, is_mod, &payload.session.id).await?;
            Ok(None)
        }
        EventsubWebsocketData::Notification { payload, .. } => {
            match payload {
                Event::ChannelChatMessageV1(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        let _ = app.emit("chat-message", msg);
                    }
                }
                Event::ChannelChatNotificationV1(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        let _ = app.emit("chat-notification", msg);
                    }
                }
                Event::ChannelShoutoutCreateV1(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        let _ = app.emit("chat-shoutout-create", msg);
                    }
                }
                Event::ChannelFollowV2(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        let _ = app.emit("channel-follow", msg);
                    }
                }
                _ => {}
            }
            Ok(None)
        }
        EventsubWebsocketData::Reconnect { payload, .. } => {
            let url = payload.session.reconnect_url.map(|u| u.to_string());
            Ok(url)
        }
        _ => Ok(None),
    }
}

async fn subscribe_to_chat(
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    token: &UserToken,
    broadcaster_id: &str,
    is_mod: bool,
    session_id: &str,
) -> Result<(), String> {
    helix
        .req_post(
            twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<ChannelChatMessageV1>::new(),
            twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(
                ChannelChatMessageV1::new(broadcaster_id, token.user_id.as_str()),
                Transport::websocket(session_id),
            ),
            token,
        )
        .await
        .map_err(|e| e.to_string())?;
    helix
        .req_post(
            twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<
                ChannelChatNotificationV1,
            >::new(),
            twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(
                ChannelChatNotificationV1::new(broadcaster_id, token.user_id.as_str()),
                Transport::websocket(session_id),
            ),
            token,
        )
        .await
        .map_err(|e| e.to_string())?;
    if is_mod {
        helix
            .req_post(
                twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<ChannelShoutoutCreateV1>::new(),
                twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(
                    ChannelShoutoutCreateV1::new(broadcaster_id, token.user_id.as_str()),
                    Transport::websocket(session_id),
                ),
                token,
            )
            .await
            .map_err(|e| e.to_string())?;
        helix
            .req_post(
                twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<ChannelFollowV2>::new(),
                twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(
                    ChannelFollowV2::new(broadcaster_id, token.user_id.as_str()),
                    Transport::websocket(session_id),
                ),
                token,
            )
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            token: Mutex::new(None),
            user_info: Mutex::new(None),
            chat_stop: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            auth::start_dcf_auth,
            auth::try_restore_session,
            auth::revoke_access_token,
            start_chat,
            twitch::streams::get_followed_streams,
            twitch::streams::get_streams_by_user_id,
            twitch::users::get_users_by_id,
            twitch::users::get_users_by_login,
            twitch::chat::send_shoutout,
            twitch::chat::send_chat_message,
            twitch::chat::get_channel_emotes,
            twitch::chat::get_user_emotes,
            twitch::chat::get_global_emotes,
            twitch::chat::get_global_chat_badges,
            twitch::chat::get_channel_chat_badges,
            twitch::moderation::delete_chat_messages,
            twitch::moderation::ban_user,
            twitch::moderation::timeout_user,
            twitch::moderation::get_moderators,
            twitch::moderation::get_moderated_channels,
            external::bttv::bttv_get_global_emotes,
            external::bttv::bttv_get_channel_emotes,
            external::ffz::ffz_get_global_emotes,
            external::ffz::ffz_get_channel_emotes,
            external::seventv::seventv_get_global_emotes,
            external::seventv::seventv_get_channel_emotes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
