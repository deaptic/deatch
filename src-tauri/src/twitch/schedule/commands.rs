use super::dto::ScheduledStream;
use super::GetSchedulesParams;
use crate::platform::error::Result;
use crate::twitch::schedule;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_schedules(
    twitch: State<'_, Twitch>,
    params: GetSchedulesParams,
) -> Result<Vec<ScheduledStream>> {
    schedule::get_schedules(&twitch.authed().await?, params).await
}
