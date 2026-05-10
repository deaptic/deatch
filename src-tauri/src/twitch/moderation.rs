use crate::{get_token, helix};
use serde::Deserialize;
use std::borrow::Cow;

use super::response::PaginatedResponse;

// https://dev.twitch.tv/docs/api/reference/#delete-chat-messages
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteChatMessagesParams {
    pub broadcaster_id: String,
    pub message_id: Option<String>,
}

#[tauri::command]
pub async fn delete_chat_messages(
    app: tauri::AppHandle,
    params: DeleteChatMessagesParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;

    let mut request =
        twitch_api::helix::moderation::delete_chat_messages::DeleteChatMessagesRequest::new(
            params.broadcaster_id.as_str(),
            token.user_id.as_str(),
        );
    request.message_id = params
        .message_id
        .map(|s| Cow::Owned(twitch_api::types::MsgId::from(s)));

    helix()
        .req_delete(request, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
// https://dev.twitch.tv/docs/api/reference/#ban-user
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BanUserParams {
    pub broadcaster_id: String,
    pub user_id: String,
    #[serde(default)]
    pub duration: Option<u32>,
    #[serde(default)]
    pub reason: Option<String>,
}

#[tauri::command]
pub async fn ban_user(
    app: tauri::AppHandle,
    params: BanUserParams,
) -> Result<twitch_api::helix::moderation::BanUser, String> {
    let token = get_token(&app).await?;
    let request = twitch_api::helix::moderation::BanUserRequest::new(
        params.broadcaster_id.as_str(),
        token.user_id.as_str(),
    );
    let body = twitch_api::helix::moderation::BanUserBody::new(
        params.user_id.as_str(),
        params.reason.unwrap_or_default(),
        params.duration,
    );
    helix()
        .req_post(request, body, &token)
        .await
        .map(|r| r.data)
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#get-moderators
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetModeratorsParams {
    pub broadcaster_id: String,
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_moderators(
    app: tauri::AppHandle,
    params: GetModeratorsParams,
) -> Result<PaginatedResponse<twitch_api::helix::moderation::Moderator>, String> {
    let token = get_token(&app).await?;

    let mut request = twitch_api::helix::moderation::GetModeratorsRequest::broadcaster_id(
        params.broadcaster_id.as_str(),
    );
    request.first = params.first;
    request.after = params
        .after
        .map(|s| Cow::Owned(twitch_api::helix::Cursor::from(s)));

    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
}

// https://dev.twitch.tv/docs/api/reference/#get-moderated-channels
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetModeratedChannelsParams {
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_moderated_channels(
    app: tauri::AppHandle,
    params: GetModeratedChannelsParams,
) -> Result<PaginatedResponse<twitch_api::helix::moderation::ModeratedChannel>, String> {
    let token = get_token(&app).await?;

    let mut request =
        twitch_api::helix::moderation::GetModeratedChannelsRequest::user_id(token.user_id.clone());
    request.first = params.first;
    request.after = params
        .after
        .map(|s| Cow::Owned(twitch_api::helix::Cursor::from(s)));

    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
}
