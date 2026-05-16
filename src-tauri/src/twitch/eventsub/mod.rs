mod dispatch;
mod runner;
mod subscribe;

use tauri::Manager;

use super::TwitchState;

pub(super) const WS_URL: &str = "wss://eventsub.wss.twitch.tv/ws";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
pub(crate) enum EventKind {
    #[serde(rename = "channel.chat.message")]
    ChannelChatMessage,
    #[serde(rename = "channel.chat.notification")]
    ChannelChatNotification,
    #[serde(rename = "channel.chat.message_delete")]
    ChannelChatMessageDelete,
    #[serde(rename = "channel.chat.clear")]
    ChannelChatClear,
    #[serde(rename = "channel.chat.clear_user_messages")]
    ChannelChatClearUserMessages,
    #[serde(rename = "channel.shoutout.create")]
    ChannelShoutoutCreate,
    #[serde(rename = "channel.follow")]
    ChannelFollow,
    #[serde(rename = "channel.moderate")]
    ChannelModerate,
}

impl EventKind {
    pub(super) fn requires_mod(self) -> bool {
        matches!(
            self,
            Self::ChannelShoutoutCreate | Self::ChannelFollow | Self::ChannelModerate
        )
    }
}

pub(crate) enum EventSubCmd {
    Subscribe { broadcaster_id: String, kind: EventKind },
    Unsubscribe { broadcaster_id: String, kind: EventKind },
}

#[tauri::command]
pub(crate) async fn subscribe(
    app: tauri::AppHandle,
    broadcaster_id: String,
    kind: EventKind,
) -> Result<(), String> {
    runner::ensure_task(&app).await?;
    send_cmd(&app, EventSubCmd::Subscribe { broadcaster_id, kind })
}

#[tauri::command]
pub(crate) async fn unsubscribe(
    app: tauri::AppHandle,
    broadcaster_id: String,
    kind: EventKind,
) -> Result<(), String> {
    send_cmd(&app, EventSubCmd::Unsubscribe { broadcaster_id, kind })
}

fn send_cmd(app: &tauri::AppHandle, cmd: EventSubCmd) -> Result<(), String> {
    let state = app.state::<TwitchState>();
    let tx_guard = state.eventsub_tx.lock().unwrap();
    if let Some(tx) = tx_guard.as_ref() {
        tx.send(cmd).map_err(|e| e.to_string())?;
    }
    Ok(())
}
