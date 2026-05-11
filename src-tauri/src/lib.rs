use futures_util::StreamExt;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::Message as WsMessage};
use twitch_api::eventsub::{
    channel::chat::{
        ChannelChatClearUserMessagesV1, ChannelChatClearV1, ChannelChatMessageDeleteV1,
        ChannelChatMessageV1, ChannelChatNotificationV1,
    },
    channel::{ChannelFollowV2, ChannelShoutoutCreateV1},
    Event, EventsubWebsocketData, Transport,
};
use twitch_api::twitch_oauth2::{TwitchToken, UserToken};

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
    pub(crate) chat_cmd_tx: Mutex<Option<mpsc::UnboundedSender<ChatCmd>>>,
}

pub(crate) enum ChatCmd {
    Add {
        broadcaster_id: String,
        is_mod: bool,
    },
    Remove {
        broadcaster_id: String,
    },
}

pub(crate) async fn get_token(app: &tauri::AppHandle) -> Result<UserToken, String> {
    let needs_refresh = {
        let state = app.state::<AppState>();
        let guard = state.token.lock().unwrap();
        match guard.as_ref() {
            None => return Err("Not authenticated".to_string()),
            Some(t) => t.expires_in() < std::time::Duration::from_secs(60),
        }
    };
    if needs_refresh {
        let _ = crate::auth::refresh_token_now(app).await;
    }
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
async fn add_chat_channel(
    app: tauri::AppHandle,
    broadcaster_id: String,
    is_mod: bool,
) -> Result<(), String> {
    ensure_chat_task(&app).await?;
    let state = app.state::<AppState>();
    let tx_guard = state.chat_cmd_tx.lock().unwrap();
    if let Some(tx) = tx_guard.as_ref() {
        tx.send(ChatCmd::Add {
            broadcaster_id,
            is_mod,
        })
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn remove_chat_channel(app: tauri::AppHandle, broadcaster_id: String) -> Result<(), String> {
    let state = app.state::<AppState>();
    let tx_guard = state.chat_cmd_tx.lock().unwrap();
    if let Some(tx) = tx_guard.as_ref() {
        tx.send(ChatCmd::Remove { broadcaster_id })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

async fn ensure_chat_task(app: &tauri::AppHandle) -> Result<(), String> {
    {
        let state = app.state::<AppState>();
        let guard = state.chat_cmd_tx.lock().unwrap();
        if guard.is_some() {
            return Ok(());
        }
    }
    let token = get_token(app).await?;
    let state = app.state::<AppState>();
    let mut guard = state.chat_cmd_tx.lock().unwrap();
    let (tx, rx) = mpsc::unbounded_channel();
    *guard = Some(tx);
    drop(guard);

    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = run_chat(app_clone.clone(), token, rx).await {
            let _ = app_clone.emit("chat-error", e);
        }
        // clear the cmd_tx so next add_chat_channel can respawn.
        let state = app_clone.state::<AppState>();
        *state.chat_cmd_tx.lock().unwrap() = None;
    });
    Ok(())
}

struct ChannelSub {
    is_mod: bool,
    sub_ids: Vec<String>,
}

async fn run_chat(
    app: tauri::AppHandle,
    token: UserToken,
    mut cmd_rx: mpsc::UnboundedReceiver<ChatCmd>,
) -> Result<(), String> {
    let helix = helix();
    let mut url = "wss://eventsub.wss.twitch.tv/ws".to_string();
    let mut subs: HashMap<String, ChannelSub> = HashMap::new();

    loop {
        let Ok((ws, _)) = connect_async(url.as_str()).await else {
            url = "wss://eventsub.wss.twitch.tv/ws".to_string();
            tokio::time::sleep(std::time::Duration::from_secs(5)).await;
            continue;
        };

        let (mut write, mut read) = ws.split();
        let mut next_url: Option<String> = None;
        let mut session_id: Option<String> = None;
        // sub IDs are tied to the previous session; clear for the new one.
        for sub in subs.values_mut() {
            sub.sub_ids.clear();
        }

        loop {
            tokio::select! {
                cmd = cmd_rx.recv() => match cmd {
                    Some(ChatCmd::Add { broadcaster_id, is_mod }) => {
                        if subs.contains_key(&broadcaster_id) {
                            // Already subscribed; update is_mod if it changed.
                            if let Some(sub) = subs.get_mut(&broadcaster_id) {
                                sub.is_mod = is_mod;
                            }
                        } else if let Some(sid) = &session_id {
                            match subscribe_to_chat(&helix, &token, &broadcaster_id, is_mod, sid).await {
                                Ok(sub_ids) => {
                                    subs.insert(broadcaster_id, ChannelSub { is_mod, sub_ids });
                                }
                                Err(e) => { let _ = app.emit("chat-error", e); }
                            }
                        } else {
                            // No session yet — record so we subscribe on Welcome.
                            subs.insert(broadcaster_id, ChannelSub { is_mod, sub_ids: vec![] });
                        }
                    }
                    Some(ChatCmd::Remove { broadcaster_id }) => {
                        if let Some(sub) = subs.remove(&broadcaster_id) {
                            for sid in sub.sub_ids {
                                let _ = delete_subscription(&helix, &token, &sid).await;
                            }
                        }
                    }
                    None => return Ok(()),
                },
                msg = read.next() => match msg {
                    Some(Ok(WsMessage::Text(text))) => {
                        match handle_ws_message(&app, &helix, &token, &mut subs, &mut session_id, &text).await {
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
            tokio::time::sleep(std::time::Duration::from_secs(3)).await;
        }
    }
}

async fn handle_ws_message(
    app: &tauri::AppHandle,
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    token: &UserToken,
    subs: &mut HashMap<String, ChannelSub>,
    session_id: &mut Option<String>,
    text: &str,
) -> Result<Option<String>, String> {
    let event = Event::parse_websocket(text).map_err(|e| e.to_string())?;
    match event {
        EventsubWebsocketData::Welcome { payload, .. } => {
            let sid = payload.session.id.to_string();
            *session_id = Some(sid.clone());
            // (Re)subscribe all known channels on this fresh session.
            for (broadcaster_id, sub) in subs.iter_mut() {
                match subscribe_to_chat(helix, token, broadcaster_id, sub.is_mod, &sid).await {
                    Ok(ids) => sub.sub_ids = ids,
                    Err(e) => {
                        let _ = app.emit("chat-error", e);
                    }
                }
            }
            Ok(None)
        }
        EventsubWebsocketData::Notification { payload, .. } => {
            match payload {
                Event::ChannelChatMessageV1(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        if subs.contains_key(msg.broadcaster_user_id.as_str()) {
                            let _ = app.emit("channel-chat-message", msg);
                        }
                    }
                }
                Event::ChannelChatNotificationV1(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        if subs.contains_key(msg.broadcaster_user_id.as_str()) {
                            let _ = app.emit("channel-chat-notification", msg);
                        }
                    }
                }
                Event::ChannelChatMessageDeleteV1(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        if subs.contains_key(msg.broadcaster_user_id.as_str()) {
                            let _ = app.emit("channel-chat-message-delete", msg);
                        }
                    }
                }
                Event::ChannelChatClearV1(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        if subs.contains_key(msg.broadcaster_user_id.as_str()) {
                            let _ = app.emit("channel-chat-clear", msg);
                        }
                    }
                }
                Event::ChannelChatClearUserMessagesV1(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        if subs.contains_key(msg.broadcaster_user_id.as_str()) {
                            let _ = app.emit("channel-chat-clear-user-messages", msg);
                        }
                    }
                }
                Event::ChannelShoutoutCreateV1(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        if subs.contains_key(msg.broadcaster_user_id.as_str()) {
                            let _ = app.emit("channel-shoutout-create", msg);
                        }
                    }
                }
                Event::ChannelFollowV2(notif) => {
                    if let twitch_api::eventsub::Message::Notification(msg) = notif.message {
                        if subs.contains_key(msg.broadcaster_user_id.as_str()) {
                            let _ = app.emit("channel-follow", msg);
                        }
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
) -> Result<Vec<String>, String> {
    let mut ids: Vec<String> = Vec::new();

    let resp =
        helix
            .req_post(
                twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<
                    ChannelChatMessageV1,
                >::new(),
                twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(
                    ChannelChatMessageV1::new(broadcaster_id, token.user_id.as_str()),
                    Transport::websocket(session_id),
                ),
                token,
            )
            .await
            .map_err(|e| e.to_string())?;
    ids.push(resp.data.id.to_string());

    let resp = helix
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
    ids.push(resp.data.id.to_string());

    let resp = helix
        .req_post(
            twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<
                ChannelChatMessageDeleteV1,
            >::new(),
            twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(
                ChannelChatMessageDeleteV1::new(broadcaster_id, token.user_id.as_str()),
                Transport::websocket(session_id),
            ),
            token,
        )
        .await
        .map_err(|e| e.to_string())?;
    ids.push(resp.data.id.to_string());

    let resp = helix
        .req_post(
            twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<ChannelChatClearV1>::new(),
            twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(
                ChannelChatClearV1::new(broadcaster_id, token.user_id.as_str()),
                Transport::websocket(session_id),
            ),
            token,
        )
        .await
        .map_err(|e| e.to_string())?;
    ids.push(resp.data.id.to_string());

    let resp = helix
        .req_post(
            twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<
                ChannelChatClearUserMessagesV1,
            >::new(),
            twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(
                ChannelChatClearUserMessagesV1::new(broadcaster_id, token.user_id.as_str()),
                Transport::websocket(session_id),
            ),
            token,
        )
        .await
        .map_err(|e| e.to_string())?;
    ids.push(resp.data.id.to_string());

    if is_mod {
        let resp = helix
            .req_post(
                twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<
                    ChannelShoutoutCreateV1,
                >::new(),
                twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(
                    ChannelShoutoutCreateV1::new(broadcaster_id, token.user_id.as_str()),
                    Transport::websocket(session_id),
                ),
                token,
            )
            .await
            .map_err(|e| e.to_string())?;
        ids.push(resp.data.id.to_string());

        let resp = helix
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
        ids.push(resp.data.id.to_string());
    }
    Ok(ids)
}

async fn delete_subscription(
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    token: &UserToken,
    subscription_id: &str,
) -> Result<(), String> {
    helix
        .req_delete(
            twitch_api::helix::eventsub::DeleteEventSubSubscriptionRequest::id(subscription_id),
            token,
        )
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::all()
                        - tauri_plugin_window_state::StateFlags::DECORATIONS,
                )
                .build(),
        )
        .manage(AppState {
            token: Mutex::new(None),
            user_info: Mutex::new(None),
            chat_cmd_tx: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            auth::start_dcf_auth,
            auth::try_restore_session,
            auth::revoke_access_token,
            add_chat_channel,
            remove_chat_channel,
            twitch::streams::get_followed_streams,
            twitch::streams::get_streams,
            twitch::users::get_users,
            twitch::chat::send_shoutout,
            twitch::chat::send_chat_message,
            twitch::chat::get_user_emotes,
            twitch::chat::get_global_emotes,
            twitch::chat::get_global_chat_badges,
            twitch::chat::get_channel_chat_badges,
            twitch::moderation::delete_chat_messages,
            twitch::moderation::ban_user,
            twitch::moderation::get_moderators,
            twitch::moderation::get_moderated_channels,
            twitch::channels::get_channel_followers,
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
