mod dispatch;
mod runner;
mod subscribe;

use tauri::Manager;

use super::TwitchState;

pub(super) const WS_URL: &str = "wss://eventsub.wss.twitch.tv/ws";

pub(crate) enum EventSubCmd {
    Add { broadcaster_id: String },
    Remove { broadcaster_id: String },
}

#[tauri::command]
pub(crate) async fn subscribe_channel(
    app: tauri::AppHandle,
    broadcaster_id: String,
) -> Result<(), String> {
    runner::ensure_task(&app).await?;
    send_cmd(&app, EventSubCmd::Add { broadcaster_id })
}

#[tauri::command]
pub(crate) async fn unsubscribe_channel(
    app: tauri::AppHandle,
    broadcaster_id: String,
) -> Result<(), String> {
    send_cmd(&app, EventSubCmd::Remove { broadcaster_id })
}

fn send_cmd(app: &tauri::AppHandle, cmd: EventSubCmd) -> Result<(), String> {
    let state = app.state::<TwitchState>();
    let tx_guard = state.eventsub_tx.lock().unwrap();
    if let Some(tx) = tx_guard.as_ref() {
        tx.send(cmd).map_err(|e| e.to_string())?;
    }
    Ok(())
}
