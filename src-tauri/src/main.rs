// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let host_mode = args.iter().any(|a| a == "--browser-host")
        || args.get(1).is_some_and(|p| p.ends_with("deatch-host.json"));
    if host_mode {
        return deatch_lib::browser_host::run();
    }
    deatch_lib::run()
}
