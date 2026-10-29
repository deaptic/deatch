mod blocking;
mod clock;
mod db;
mod diagnostics;
mod discord;
mod emit;
mod emotes;
mod error;
mod feedlog;
mod graphics;
mod history;
mod http;
mod keyring;
mod link;
mod local_dir;
mod notifications;
mod twitch;
mod ws;

pub use link::host as browser_host;

use tauri::Manager;

const LOG_FILE_BYTES: u128 = 5_000_000;
const LOG_FILES_KEPT: usize = 3;

fn bindings() -> tauri_specta::Builder<tauri::Wry> {
    tauri_specta::Builder::<tauri::Wry>::new()
        .error_handling(tauri_specta::ErrorHandlingMode::Throw)
        .dangerously_cast_bigints_to_number()
        .typ::<error::Error>()
        .typ::<twitch::eventsub::EventKind>()
        .constant(
            "EVENTSUB_EVENT_NAMES",
            twitch::eventsub::EventKind::event_names(),
        )
        .events(tauri_specta::collect_events![
            twitch::auth::events::AuthSucceeded,
            twitch::auth::events::AuthFailed,
            twitch::auth::events::SessionEnded,
            twitch::eventsub::events::EventSubConnection,
            twitch::eventsub::events::EventSubRecovered,
            twitch::eventsub::events::ChatStatus,
            twitch::moderation::events::ModeratedChannelsChanged,
            emotes::events::EmoteSetUpdated,
            link::events::LinkState,
            link::events::LinkDisconnected,
        ])
        .commands(tauri_specta::collect_commands![
            feedlog::commands::feedlog_append,
            feedlog::commands::feedlog_page,
            feedlog::commands::feedlog_around,
            discord::commands::discord_connect,
            discord::commands::discord_disconnect,
            discord::commands::discord_set_activity,
            twitch::auth::commands::get_device_code,
            twitch::auth::commands::cancel_login,
            twitch::auth::commands::restore_session,
            twitch::auth::commands::revoke_session,
            twitch::eventsub::commands::set_eventsub_channels,
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
            twitch::bits::commands::get_cheermotes,
            twitch::chat::commands::get_chat_settings,
            twitch::chat::commands::update_chat_settings,
            twitch::chat::commands::get_user_chat_color,
            twitch::chat::commands::update_user_chat_color,
            twitch::chat::commands::get_user_emotes,
            twitch::chat::commands::get_global_emotes,
            twitch::chat::commands::get_global_chat_badges,
            twitch::chat::commands::get_channel_chat_badges,
            twitch::moderation::commands::delete_chat_messages,
            twitch::moderation::commands::ban_user,
            twitch::moderation::commands::unban_user,
            twitch::moderation::commands::get_ban,
            twitch::moderation::commands::warn_user,
            twitch::moderation::commands::manage_held_automod_message,
            twitch::channels::commands::add_channel_vip,
            twitch::channels::commands::remove_channel_vip,
            twitch::raids::commands::start_raid,
            twitch::raids::commands::cancel_raid,
            twitch::clips::commands::create_clip,
            twitch::channels::commands::get_channel_information,
            twitch::channels::commands::get_followed_at,
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
            link::commands::link_set_muted,
            link::commands::link_focus,
            link::commands::link_close,
            link::commands::link_set_audio,
            link::commands::link_request_state,
            notifications::commands::set_mentions_badge,
            graphics::commands::set_hardware_acceleration,
            diagnostics::commands::get_app_stats,
        ])
}

const BINDINGS_PATH: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../src/lib/bindings.ts");

pub fn export_bindings() {
    export_to(&bindings(), std::path::Path::new(BINDINGS_PATH));
}

fn export_to(bindings: &tauri_specta::Builder<tauri::Wry>, path: &std::path::Path) {
    bindings
        .export(specta_typescript::Typescript::default(), path)
        .expect("failed to export typescript bindings");
}

fn bring_to_front(app: &tauri::AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    if let Err(e) = window.unminimize().and_then(|()| window.set_focus()) {
        log::warn!("window not brought to front: {e}");
    }
}

/// Every feature's tables in the per-account databases.
const SCHEMAS: &[db::Schema] = &[feedlog::SCHEMA];

pub fn run() {
    let bindings = bindings();
    #[cfg(debug_assertions)]
    export_to(&bindings, std::path::Path::new(BINDINGS_PATH));
    let invoke_handler = bindings.invoke_handler();
    graphics::apply_startup_flags();
    let mut builder = tauri::Builder::default();
    // Two copies would refresh the same single-use token and sign each other
    // out. A dev build is left free to run beside the installed app.
    if !cfg!(debug_assertions) {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _, _| {
            bring_to_front(app);
        }));
    }
    builder
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .max_file_size(LOG_FILE_BYTES)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepSome(LOG_FILES_KEPT))
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::all()
                        - tauri_plugin_window_state::StateFlags::DECORATIONS,
                )
                .build(),
        )
        .setup(move |app| {
            keyring::init_store();
            bindings.mount_events(app);
            let http = http::client()?;
            let twitch = twitch::Twitch::new(http.clone(), app.handle().clone());
            twitch::eventsub::spawn(app.handle().clone(), twitch.clone());
            app.manage(twitch);
            app.manage(http);

            // A dev build must never become the browser's native-messaging
            // host: Firefox would keep spawning target/debug/deatch.exe and
            // hold the file lock cargo needs to relink.
            if !cfg!(debug_assertions) {
                if let Err(e) = link::bridge::register() {
                    log::warn!("browser bridge registration failed: {e}");
                }
            }
            let hosts = link::ipc::Hosts::default();
            link::ipc::start_server(app.handle().clone(), hosts.clone());
            app.manage(hosts);
            app.manage(emotes::seventv_events::spawn(app.handle().clone()));
            app.manage(db::Databases::open(SCHEMAS)?);
            feedlog::spawn_pruning(app.handle().clone());

            Ok(())
        })
        .manage(discord::DiscordState::default())
        .manage(diagnostics::Monitor::default())
        .invoke_handler(invoke_handler)
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                app.state::<db::Databases>().close();
            }
        });
}

#[cfg(test)]
mod tests {
    fn normalized(path: &std::path::Path) -> String {
        std::fs::read_to_string(path).unwrap().replace("\r\n", "\n")
    }

    #[test]
    fn committed_bindings_are_current() {
        let fresh = std::env::temp_dir().join("deatch-bindings-check.ts");
        super::export_to(&super::bindings(), &fresh);
        assert!(
            normalized(&fresh) == normalized(std::path::Path::new(super::BINDINGS_PATH)),
            "src/lib/bindings.ts is stale; run `pnpm bindings` and commit the result"
        );
    }
}
