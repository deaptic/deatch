use crate::{get_token, helix};

#[tauri::command]
pub async fn delete_chat_messages(
    app: tauri::AppHandle,
    broadcaster_id: String,
    message_id: Option<String>,
) -> Result<(), String> {
    let token = get_token(&app)?;

    let mut request = twitch_api::helix::moderation::delete_chat_messages::DeleteChatMessagesRequest::new(
        broadcaster_id.as_str(),
        token.user_id.as_str(),
    );

    request.message_id = message_id.map(|s| std::borrow::Cow::Owned(twitch_api::types::MsgId::from(s)));

    helix()
        .req_delete(request, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ban_user(
    app: tauri::AppHandle,
    broadcaster_id: String,
    user_id: String,
    reason: String,
) -> Result<(), String> {
    let token = get_token(&app)?;
    let request = twitch_api::helix::moderation::BanUserRequest::new(
        broadcaster_id.as_str(),
        token.user_id.as_str(),
    );
    let body = twitch_api::helix::moderation::BanUserBody::new(
        user_id.as_str(),
        reason,
        None,
    );
    helix()
        .req_post(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn timeout_user(
    app: tauri::AppHandle,
    broadcaster_id: String,
    user_id: String,
    duration: u32,
    reason: String,
) -> Result<(), String> {
    let token = get_token(&app)?;
    let request = twitch_api::helix::moderation::BanUserRequest::new(
        broadcaster_id.as_str(),
        token.user_id.as_str(),
    );
    let body = twitch_api::helix::moderation::BanUserBody::new(
        user_id.as_str(),
        reason,
        Some(duration),
    );
    helix()
        .req_post(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_moderators(
    app: tauri::AppHandle,
    broadcaster_id: String,
) -> Result<Vec<twitch_api::helix::moderation::Moderator>, String> {
    let token = get_token(&app)?;

    let request =
        twitch_api::helix::moderation::GetModeratorsRequest::broadcaster_id(broadcaster_id.as_str());

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}


#[tauri::command]
pub async fn get_moderated_channels(
    app: tauri::AppHandle,
) -> Result<Vec<twitch_api::helix::moderation::ModeratedChannel>, String> {
    let token = get_token(&app)?;

    let request =
        twitch_api::helix::moderation::GetModeratedChannelsRequest::user_id(token.user_id.as_str());

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}
