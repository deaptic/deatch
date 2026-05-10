use crate::{get_token, helix};
use serde::Deserialize;

use super::response::PaginatedResponse;

// https://dev.twitch.tv/docs/api/reference/#get-global-emotes
#[tauri::command]
pub async fn get_global_emotes(
    app: tauri::AppHandle,
) -> Result<Vec<twitch_api::helix::chat::GlobalEmote>, String> {
    let token = get_token(&app).await?;

    let request = twitch_api::helix::chat::GetGlobalEmotesRequest::new();

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}

// https://dev.twitch.tv/docs/api/reference/#get-user-emotes
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetUserEmotesParams {
    pub broadcaster_id: Option<String>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_user_emotes(
    app: tauri::AppHandle,
    params: GetUserEmotesParams,
) -> Result<PaginatedResponse<twitch_api::helix::chat::UserEmote>, String> {
    let token = get_token(&app).await?;
    let mut request = twitch_api::helix::chat::GetUserEmotesRequest::user_id(token.user_id.clone());
    request.broadcaster_id = params
        .broadcaster_id
        .map(|s| std::borrow::Cow::Owned(twitch_api::types::UserId::from(s)));
    request.after = params
        .after
        .map(|s| std::borrow::Cow::Owned(twitch_api::helix::Cursor::from(s)));

    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
}

// https://dev.twitch.tv/docs/api/reference/#get-global-chat-badges
#[tauri::command]
pub async fn get_global_chat_badges(
    app: tauri::AppHandle,
) -> Result<Vec<twitch_api::helix::chat::BadgeSet>, String> {
    let token = get_token(&app).await?;

    let request = twitch_api::helix::chat::GetGlobalChatBadgesRequest::new();

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}

// https://dev.twitch.tv/docs/api/reference/#get-channel-chat-badges
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetChannelChatBadgesParams {
    pub broadcaster_id: String,
}

#[tauri::command]
pub async fn get_channel_chat_badges(
    app: tauri::AppHandle,
    params: GetChannelChatBadgesParams,
) -> Result<Vec<twitch_api::helix::chat::BadgeSet>, String> {
    let token = get_token(&app).await?;

    let request = twitch_api::helix::chat::GetChannelChatBadgesRequest::broadcaster_id(
        params.broadcaster_id.as_str(),
    );

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}

// https://dev.twitch.tv/docs/api/reference/#send-a-shoutout
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendShoutoutParams {
    pub from_broadcaster_id: String,
    pub to_broadcaster_id: String,
}

#[tauri::command]
pub async fn send_shoutout(
    app: tauri::AppHandle,
    params: SendShoutoutParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;

    let request = twitch_api::helix::chat::send_a_shoutout::SendAShoutoutRequest::new(
        params.from_broadcaster_id.as_str(),
        params.to_broadcaster_id.as_str(),
        token.user_id.as_str(),
    );

    let body = twitch_api::helix::EmptyBody;

    helix()
        .req_post(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#send-chat-message
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendChatMessageParams {
    pub broadcaster_id: String,
    pub message: String,
    pub reply_parent_message_id: Option<String>,
}

#[tauri::command]
pub async fn send_chat_message(
    app: tauri::AppHandle,
    params: SendChatMessageParams,
) -> Result<twitch_api::helix::chat::send_chat_message::SendChatMessageResponse, String> {
    let token = get_token(&app).await?;

    let request = twitch_api::helix::chat::send_chat_message::SendChatMessageRequest::new();

    let mut body = twitch_api::helix::chat::send_chat_message::SendChatMessageBody::new(
        params.broadcaster_id.as_str(),
        token.user_id.as_str(),
        params.message.as_str(),
    );

    body.reply_parent_message_id = params
        .reply_parent_message_id
        .map(|s| std::borrow::Cow::Owned(twitch_api::types::MsgId::from(s)));

    helix()
        .req_post(request, body, &token)
        .await
        .map(|r| r.data)
        .map_err(|e| e.to_string())
}
