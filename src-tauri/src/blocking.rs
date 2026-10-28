use crate::error::Result;

/// Runs blocking work (a pipe that can stall, an OS query) off the async
/// workers. Managed state can't be borrowed into the blocking thread, so the
/// closure gets the app handle and pulls its state there.
pub async fn run<R: Send + 'static>(
    app: tauri::AppHandle,
    work: impl FnOnce(&tauri::AppHandle) -> R + Send + 'static,
) -> Result<R> {
    Ok(tauri::async_runtime::spawn_blocking(move || work(&app)).await?)
}
