use crate::platform::error::Result;

pub async fn run<R: Send + 'static>(
    app: tauri::AppHandle,
    work: impl FnOnce(&tauri::AppHandle) -> R + Send + 'static,
) -> Result<R> {
    Ok(tauri::async_runtime::spawn_blocking(move || work(&app)).await?)
}
