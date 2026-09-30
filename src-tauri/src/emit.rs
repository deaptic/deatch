use serde::Serialize;
use tauri_specta::Event;

pub fn emit<E: Event + Serialize + Clone>(app: &tauri::AppHandle, event: E) {
    if let Err(e) = event.emit(app) {
        eprintln!("[emit] {} failed: {e}", E::NAME);
    }
}
