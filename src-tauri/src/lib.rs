mod bridge;
pub mod browser_host;
mod commands;
mod dto;
pub mod ipc;
mod services;

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
            services::external::seventv_events::spawn(app.handle().clone());

            if let Some(w) = tauri::Manager::get_webview_window(app, "main") {
                if let Ok(icon) = tauri::image::Image::from_bytes(include_bytes!(
                    "../icons/taskbar.png"
                )) {
                    let _ = w.set_icon(icon);
                }
            }

            Ok(())
        })
        .manage(services::twitch::TwitchState::new())
        .manage(services::discord::DiscordState::new())
        .invoke_handler(tauri::generate_handler![
            commands::discord::discord_connect,
            commands::discord::discord_disconnect,
            commands::discord::discord_set_activity,
            commands::discord::discord_clear_activity,
            commands::twitch::auth::get_device_code,
            commands::twitch::auth::restore_session,
            commands::twitch::auth::revoke_session,
            commands::twitch::eventsub::subscribe,
            commands::twitch::eventsub::unsubscribe,
            commands::twitch::streams::get_followed_streams,
            commands::twitch::streams::get_streams,
            commands::twitch::streams::create_stream_marker,
            commands::twitch::users::get_users,
            commands::twitch::chat::send_shoutout,
            commands::twitch::chat::send_chat_message,
            commands::twitch::chat::send_chat_announcement,
            commands::twitch::chat::update_chat_settings,
            commands::twitch::chat::update_user_chat_color,
            commands::twitch::chat::get_user_emotes,
            commands::twitch::chat::get_global_emotes,
            commands::twitch::chat::get_global_chat_badges,
            commands::twitch::chat::get_channel_chat_badges,
            commands::twitch::moderation::delete_chat_messages,
            commands::twitch::moderation::ban_user,
            commands::twitch::moderation::unban_user,
            commands::twitch::moderation::get_banned_users,
            commands::twitch::moderation::get_moderators,
            commands::twitch::moderation::get_moderated_channels,
            commands::twitch::moderation::warn_user,
            commands::twitch::moderation::approve_held_automod_message,
            commands::twitch::moderation::deny_held_automod_message,
            commands::twitch::channels::add_channel_vip,
            commands::twitch::channels::remove_channel_vip,
            commands::twitch::raids::start_raid,
            commands::twitch::raids::cancel_raid,
            commands::twitch::clips::create_clip,
            commands::twitch::channels::get_channel_followers,
            commands::twitch::channels::get_followed_channels,
            commands::twitch::channels::modify_channel_information,
            commands::twitch::channels::start_commercial,
            commands::external::bttv::bttv_get_global_emotes,
            commands::external::bttv::bttv_get_channel_emotes,
            commands::external::ffz::ffz_get_global_emotes,
            commands::external::ffz::ffz_get_channel_emotes,
            commands::external::seventv::seventv_get_global_emotes,
            commands::external::seventv::seventv_get_channel_emotes,
            commands::external::seventv_events::seventv_subscribe_emote_set,
            commands::external::seventv_events::seventv_unsubscribe_emote_set,
            commands::external::robotty::get_recent_messages,
            commands::keymap::read_keymap,
            commands::keymap::write_keymap,
            commands::watch::watch_set_muted,
            commands::watch::watch_request_state,
            commands::notifications::set_mentions_badge,
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
