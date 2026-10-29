// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if deatch_lib::browser_host::launched_by_browser(&args) {
        return deatch_lib::browser_host::run();
    }
    if args.iter().any(|a| a == "--export-bindings") {
        return deatch_lib::export_bindings();
    }
    deatch_lib::run()
}
