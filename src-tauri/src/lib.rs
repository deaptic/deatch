mod bridge;
pub mod browser_host;
mod discord;
mod external;
pub mod ipc;
mod keymap;
mod twitch;

fn init_keyring_store() {
    #[cfg(target_os = "windows")]
    {
        match windows_native_keyring_store::Store::new() {
            Ok(store) => keyring_core::set_default_store(store),
            Err(e) => eprintln!("keyring store init failed: {e}"),
        }
    }
    #[cfg(target_os = "macos")]
    {
        match apple_native_keyring_store::Store::new() {
            Ok(store) => keyring_core::set_default_store(store),
            Err(e) => eprintln!("keyring store init failed: {e}"),
        }
    }
    #[cfg(any(target_os = "linux", target_os = "freebsd"))]
    {
        match dbus_secret_service_keyring_store::Store::new() {
            Ok(store) => keyring_core::set_default_store(store),
            Err(e) => eprintln!("keyring store init failed: {e}"),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_keyring_store();
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
        .setup(|app| {
            if let Err(e) = bridge::register() {
                eprintln!("browser bridge registration failed: {e}");
            }
            ipc::start_server(app.handle().clone());
            external::seventv_events::spawn(app.handle().clone());
            Ok(())
        })
        .manage(twitch::TwitchState::new())
        .manage(discord::DiscordState::new())
        .invoke_handler(tauri::generate_handler![
            discord::discord_connect,
            discord::discord_disconnect,
            discord::discord_set_activity,
            discord::discord_clear_activity,
            twitch::auth::get_device_code,
            twitch::auth::restore_session,
            twitch::auth::revoke_session,
            twitch::eventsub::subscribe,
            twitch::eventsub::unsubscribe,
            twitch::streams::get_followed_streams,
            twitch::streams::get_all_followed_streams,
            twitch::streams::get_streams,
            twitch::streams::get_all_streams,
            twitch::streams::create_stream_marker,
            twitch::users::get_users,
            twitch::chat::send_shoutout,
            twitch::chat::send_chat_message,
            twitch::chat::send_chat_announcement,
            twitch::chat::update_chat_settings,
            twitch::chat::update_user_chat_color,
            twitch::chat::get_user_emotes,
            twitch::chat::get_all_user_emotes,
            twitch::chat::stream_user_emotes,
            twitch::chat::get_global_emotes,
            twitch::chat::get_global_chat_badges,
            twitch::chat::get_channel_chat_badges,
            twitch::moderation::delete_chat_messages,
            twitch::moderation::ban_user,
            twitch::moderation::unban_user,
            twitch::moderation::get_banned_users,
            twitch::moderation::get_all_banned_users,
            twitch::moderation::get_moderators,
            twitch::moderation::get_all_moderators,
            twitch::moderation::get_moderated_channels,
            twitch::moderation::get_all_moderated_channels,
            twitch::moderation::add_channel_vip,
            twitch::moderation::remove_channel_vip,
            twitch::moderation::start_raid,
            twitch::moderation::cancel_raid,
            twitch::moderation::warn_user,
            twitch::channels::get_channel_followers,
            twitch::channels::get_all_channel_followers,
            twitch::channels::get_followed_channels,
            twitch::channels::modify_channel_information,
            twitch::channels::start_commercial,
            external::bttv::bttv_get_global_emotes,
            external::bttv::bttv_get_channel_emotes,
            external::ffz::ffz_get_global_emotes,
            external::ffz::ffz_get_channel_emotes,
            external::seventv::seventv_get_global_emotes,
            external::seventv::seventv_get_channel_emotes,
            external::seventv_events::seventv_watch_emote_set,
            external::robotty::get_recent_messages,
            keymap::read_keymap,
            keymap::write_keymap,
        ])
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
