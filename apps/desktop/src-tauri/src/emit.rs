use serde::Serialize;
use tauri::Emitter;
use tauri_specta::Event;

pub fn emit<E: Event + Serialize + Clone>(app: &tauri::AppHandle, event: E) {
    report(E::NAME, event.emit(app));
}

pub fn emit_named<S: Serialize + Clone>(app: &tauri::AppHandle, name: &str, payload: S) {
    report(name, app.emit(name, payload));
}

fn report(name: &str, result: tauri::Result<()>) {
    match result {
        Ok(()) => log::debug!("emit {name}"),
        Err(e) => log::error!("emit {name} failed: {e}"),
    }
}
