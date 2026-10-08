// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let args: Vec<String> = std::env::args().collect();
    // Firefox launches the host with the manifest path, Chromium with the
    // extension origin.
    let host_mode = args.iter().any(|a| a == "--browser-host")
        || args.get(1).is_some_and(|p| {
            p.ends_with("deatch-host.json") || p.starts_with("chrome-extension://")
        });
    if host_mode {
        return deatch_lib::browser_host::run();
    }
    if args.iter().any(|a| a == "--export-bindings") {
        return deatch_lib::export_bindings();
    }
    deatch_lib::run()
}
