mod external;
mod twitch;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
        .manage(twitch::TwitchState::new())
        .invoke_handler(tauri::generate_handler![
            twitch::auth::get_device_code,
            twitch::auth::restore_session,
            twitch::auth::revoke_session,
            twitch::eventsub::subscribe_channel,
            twitch::eventsub::unsubscribe_channel,
            twitch::streams::get_followed_streams,
            twitch::streams::get_all_followed_streams,
            twitch::streams::get_streams,
            twitch::streams::get_all_streams,
            twitch::users::get_users,
            twitch::chat::send_shoutout,
            twitch::chat::send_chat_message,
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
            twitch::channels::get_channel_followers,
            twitch::channels::get_all_channel_followers,
            external::bttv::bttv_get_global_emotes,
            external::bttv::bttv_get_channel_emotes,
            external::ffz::ffz_get_global_emotes,
            external::ffz::ffz_get_channel_emotes,
            external::seventv::seventv_get_global_emotes,
            external::seventv::seventv_get_channel_emotes,
            external::robotty::get_recent_messages,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
