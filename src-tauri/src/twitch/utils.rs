use std::collections::HashSet;
use std::time::Duration;

use tauri::Manager;
use twitch_api::helix::moderation::ModeratedChannel;
use twitch_api::helix::RequestGet;
use twitch_api::twitch_oauth2::UserToken;

use super::{helix, TwitchState};

/// Helix gives user tokens 800 points/minute (~13 req/sec). We pace at ~10
/// req/sec so a long paginator (e.g. a popular channel's followers) can't
/// blow the budget on its own and so concurrent calls have headroom. Single-
/// page fetches don't pay this — the sleep only runs when there's another
/// page to retrieve.
const PAGE_INTERVAL: Duration = Duration::from_millis(100);

/// Drives a Helix paginated GET to completion. `make_request` is called once
/// per page; it receives the previous page's cursor (or `None` on the first
/// call) and returns a fresh request with that cursor applied. Pages are
/// concatenated into the returned `Vec`.
pub(super) async fn fetch_all_pages<R, T, F>(
    token: &UserToken,
    mut make_request: F,
) -> Result<Vec<T>, String>
where
    F: FnMut(Option<String>) -> R,
    R: RequestGet<Response = Vec<T>>,
    T: serde::de::DeserializeOwned + PartialEq,
{
    let helix = helix();
    let mut all: Vec<T> = Vec::new();
    let mut after: Option<String> = None;
    loop {
        let request = make_request(after.take());
        let response = helix
            .req_get(request, token)
            .await
            .map_err(|e| e.to_string())?;
        all.extend(response.data);
        match response.pagination {
            Some(cursor) => {
                after = Some(cursor.as_str().to_string());
                tokio::time::sleep(PAGE_INTERVAL).await;
            }
            None => return Ok(all),
        }
    }
}

/// Like `fetch_all_pages` but hands each page to `emit_page` as it arrives
/// instead of buffering. Use for long paginators where the frontend can
/// render incrementally rather than waiting for the full result.
pub(super) async fn stream_all_pages<R, T, F, E>(
    token: &UserToken,
    mut make_request: F,
    mut emit_page: E,
) -> Result<(), String>
where
    F: FnMut(Option<String>) -> R,
    R: RequestGet<Response = Vec<T>>,
    T: serde::de::DeserializeOwned + PartialEq,
    E: FnMut(Vec<T>),
{
    let helix = helix();
    let mut after: Option<String> = None;
    loop {
        let request = make_request(after.take());
        let response = helix
            .req_get(request, token)
            .await
            .map_err(|e| e.to_string())?;
        emit_page(response.data);
        match response.pagination {
            Some(cursor) => {
                after = Some(cursor.as_str().to_string());
                tokio::time::sleep(PAGE_INTERVAL).await;
            }
            None => return Ok(()),
        }
    }
}

/// Replaces `TwitchState.moderated_channel_ids` with the set of broadcaster
/// IDs from the given channels. Call this with the result of every fetch so
/// the eventsub task's `is_mod` lookups stay in sync.
pub(super) fn cache_moderated_channel_ids(app: &tauri::AppHandle, channels: &[ModeratedChannel]) {
    let ids: HashSet<String> = channels
        .iter()
        .map(|ch| ch.broadcaster_id.as_str().to_string())
        .collect();
    *app.state::<TwitchState>().moderated_channel_ids.lock().unwrap() = ids;
}
