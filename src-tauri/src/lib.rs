mod discord;
mod emotes;
mod error;
mod history;
mod http;
mod keymap;
mod keyring;
mod notifications;
mod twitch;
mod watch;

pub use watch::host as browser_host;

use tauri::Manager;

fn bindings() -> tauri_specta::Builder<tauri::Wry> {
    tauri_specta::Builder::<tauri::Wry>::new()
        .error_handling(tauri_specta::ErrorHandlingMode::Throw)
        .dangerously_cast_bigints_to_number()
        .typ::<error::Error>()
        .typ::<emotes::dto::Delta>()
        .commands(tauri_specta::collect_commands![
            discord::commands::discord_connect,
            discord::commands::discord_disconnect,
            discord::commands::discord_set_activity,
            discord::commands::discord_clear_activity,
            twitch::auth::commands::get_device_code,
            twitch::auth::commands::restore_session,
            twitch::auth::commands::revoke_session,
            twitch::eventsub::commands::subscribe,
            twitch::eventsub::commands::unsubscribe,
            twitch::streams::commands::get_followed_streams,
            twitch::streams::commands::get_streams,
            twitch::streams::commands::get_streams_from_ids,
            twitch::streams::commands::create_stream_marker,
            twitch::users::commands::get_users,
            twitch::search::commands::search_channels,
            twitch::search::commands::search_categories,
            twitch::chat::commands::send_shoutout,
            twitch::chat::commands::send_chat_message,
            twitch::chat::commands::send_chat_announcement,
            twitch::chat::commands::update_chat_settings,
            twitch::chat::commands::update_user_chat_color,
            twitch::chat::commands::get_user_emotes,
            twitch::chat::commands::get_global_emotes,
            twitch::chat::commands::get_global_chat_badges,
            twitch::chat::commands::get_channel_chat_badges,
            twitch::moderation::commands::delete_chat_messages,
            twitch::moderation::commands::ban_user,
            twitch::moderation::commands::unban_user,
            twitch::moderation::commands::get_banned_users,
            twitch::moderation::commands::get_moderators,
            twitch::moderation::commands::get_moderated_channels,
            twitch::moderation::commands::warn_user,
            twitch::moderation::commands::manage_held_automod_message,
            twitch::channels::commands::add_channel_vip,
            twitch::channels::commands::remove_channel_vip,
            twitch::raids::commands::start_raid,
            twitch::raids::commands::cancel_raid,
            twitch::clips::commands::create_clip,
            twitch::channels::commands::get_channel_information,
            twitch::channels::commands::get_channel_followers,
            twitch::channels::commands::get_followed_channels,
            twitch::channels::commands::modify_channel_information,
            twitch::channels::commands::start_commercial,
            emotes::commands::bttv_get_global_emotes,
            emotes::commands::bttv_get_channel_emotes,
            emotes::commands::ffz_get_global_emotes,
            emotes::commands::ffz_get_channel_emotes,
            emotes::commands::seventv_get_global_emotes,
            emotes::commands::seventv_get_channel_emotes,
            emotes::commands::seventv_subscribe_emote_set,
            emotes::commands::seventv_unsubscribe_emote_set,
            history::commands::get_recent_messages,
            keymap::commands::read_keymap,
            keymap::commands::write_keymap,
            watch::commands::watch_set_muted,
            watch::commands::watch_request_state,
            notifications::commands::set_mentions_badge,
        ])
}

#[cfg(debug_assertions)]
fn export_bindings(bindings: &tauri_specta::Builder<tauri::Wry>) {
    bindings
        .export(
            specta_typescript::Typescript::default(),
            concat!(env!("CARGO_MANIFEST_DIR"), "/../src/lib/bindings.ts"),
        )
        .expect("failed to export typescript bindings");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    keyring::init_store();
    let bindings = bindings();
    #[cfg(debug_assertions)]
    export_bindings(&bindings);
    let invoke_handler = bindings.invoke_handler();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::all()
                        - tauri_plugin_window_state::StateFlags::DECORATIONS,
                )
                .build(),
        )
        .setup(move |app| {
            bindings.mount_events(app);
            let http = http::client()?;
            app.manage(twitch::Twitch::new(http.clone()));
            app.manage(http);

            // A dev build must never become the browser's native-messaging
            // host: Firefox would keep spawning target/debug/deatch.exe and
            // hold the file lock cargo needs to relink.
            if !cfg!(debug_assertions) {
                if let Err(e) = watch::bridge::register() {
                    eprintln!("browser bridge registration failed: {e}");
                }
            }
            watch::ipc::start_server(app.handle().clone());
            emotes::seventv_events::spawn(app.handle().clone());

            if let Some(w) = app.get_webview_window("main") {
                if let Ok(icon) =
                    tauri::image::Image::from_bytes(include_bytes!("../icons/taskbar.png"))
                {
                    let _ = w.set_icon(icon);
                }
            }

            Ok(())
        })
        .manage(discord::DiscordState::new())
        .invoke_handler(invoke_handler)
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, event| {
            // ipc::start_server spawns a tokio task blocked on accept()
            // forever; without an explicit exit, its worker threads keep the
            // process alive after the window closes.
            match event {
                tauri::RunEvent::WindowEvent {
                    event: tauri::WindowEvent::CloseRequested { .. },
                    ..
                }
                | tauri::RunEvent::ExitRequested { .. }
                | tauri::RunEvent::Exit => std::process::exit(0),
                _ => {}
            }
        });
}
