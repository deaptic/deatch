use super::{get_token, helix};
use serde::Deserialize;
use std::borrow::Cow;
use twitch_api::helix::chat::{
    send_a_shoutout::SendAShoutoutRequest,
    send_chat_announcement::{SendChatAnnouncementBody, SendChatAnnouncementRequest},
    send_chat_message::{SendChatMessageBody, SendChatMessageRequest, SendChatMessageResponse},
    update_chat_settings::{UpdateChatSettingsBody, UpdateChatSettingsRequest},
    update_user_chat_color::UpdateUserChatColorRequest,
    BadgeSet, GetChannelChatBadgesRequest, GetGlobalChatBadgesRequest, GetGlobalEmotesRequest,
    GetUserEmotesRequest, GlobalEmote, UserEmote,
};
use twitch_api::helix::{Cursor, EmptyBody};
use twitch_api::types::{MsgId, NamedUserColor, UserId};

use super::response::PaginatedResponse;

// https://dev.twitch.tv/docs/api/reference/#get-global-emotes
#[tauri::command]
pub async fn get_global_emotes(app: tauri::AppHandle) -> Result<Vec<GlobalEmote>, String> {
    let token = get_token(&app).await?;

    let request = GetGlobalEmotesRequest::new();

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
) -> Result<PaginatedResponse<UserEmote>, String> {
    let token = get_token(&app).await?;
    let mut request = GetUserEmotesRequest::user_id(token.user_id.clone());
    request.broadcaster_id = params.broadcaster_id.map(|s| Cow::Owned(UserId::from(s)));
    request.after = params.after.map(|s| Cow::Owned(Cursor::from(s)));

    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetAllUserEmotesParams {
    pub broadcaster_id: Option<String>,
}

#[tauri::command]
pub async fn get_all_user_emotes(
    app: tauri::AppHandle,
    params: GetAllUserEmotesParams,
) -> Result<Vec<UserEmote>, String> {
    let token = get_token(&app).await?;
    let bc = params.broadcaster_id;
    super::utils::fetch_all_pages(&token, |after| {
        let mut request = GetUserEmotesRequest::user_id(token.user_id.clone());
        request.broadcaster_id = bc.as_deref().map(|s| Cow::Owned(UserId::from(s)));
        request.after = after.map(|s| Cow::Owned(Cursor::from(s)));
        request
    })
    .await
}

/// Streams pages of user emotes to the frontend via the `user-emote-page`
/// Tauri event. The frontend appends each page as it arrives so the picker
/// becomes usable after the first ~1.3s instead of waiting for the full ~12s.
#[tauri::command]
pub async fn stream_user_emotes(
    app: tauri::AppHandle,
    params: GetAllUserEmotesParams,
) -> Result<(), String> {
    use tauri::Emitter;
    let token = get_token(&app).await?;
    let bc = params.broadcaster_id;
    super::utils::stream_all_pages(
        &token,
        |after| {
            let mut request = GetUserEmotesRequest::user_id(token.user_id.clone());
            request.broadcaster_id = bc.as_deref().map(|s| Cow::Owned(UserId::from(s)));
            request.after = after.map(|s| Cow::Owned(Cursor::from(s)));
            request
        },
        |page| {
            let _ = app.emit("user-emote-page", page);
        },
    )
    .await
}

// https://dev.twitch.tv/docs/api/reference/#get-global-chat-badges
#[tauri::command]
pub async fn get_global_chat_badges(app: tauri::AppHandle) -> Result<Vec<BadgeSet>, String> {
    let token = get_token(&app).await?;

    let request = GetGlobalChatBadgesRequest::new();

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
) -> Result<Vec<BadgeSet>, String> {
    let token = get_token(&app).await?;

    let request = GetChannelChatBadgesRequest::broadcaster_id(params.broadcaster_id.as_str());

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

    let request = SendAShoutoutRequest::new(
        params.from_broadcaster_id.as_str(),
        params.to_broadcaster_id.as_str(),
        token.user_id.as_str(),
    );

    helix()
        .req_post(request, EmptyBody, &token)
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
) -> Result<SendChatMessageResponse, String> {
    let token = get_token(&app).await?;

    let request = SendChatMessageRequest::new();

    let mut body = SendChatMessageBody::new(
        params.broadcaster_id.as_str(),
        token.user_id.as_str(),
        params.message.as_str(),
    );

    body.reply_parent_message_id = params
        .reply_parent_message_id
        .map(|s| Cow::Owned(MsgId::from(s)));

    helix()
        .req_post(request, body, &token)
        .await
        .map(|r| r.data)
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#send-chat-announcement
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendChatAnnouncementParams {
    pub broadcaster_id: String,
    pub message: String,
    #[serde(default)]
    pub color: Option<String>,
}

#[tauri::command]
pub async fn send_chat_announcement(
    app: tauri::AppHandle,
    params: SendChatAnnouncementParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;

    let request = SendChatAnnouncementRequest::new(
        params.broadcaster_id.as_str(),
        token.user_id.as_str(),
    );

    let color = params.color.as_deref().unwrap_or("primary");
    let body = SendChatAnnouncementBody::new(params.message.as_str(), color)
        .map_err(|e| format!("invalid announcement color: {e}"))?;

    helix()
        .req_post(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#update-chat-settings
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChatSettingsParams {
    pub broadcaster_id: String,
    #[serde(default)]
    pub emote_mode: Option<bool>,
    #[serde(default)]
    pub follower_mode: Option<bool>,
    #[serde(default)]
    pub follower_mode_duration: Option<u64>,
    #[serde(default)]
    pub slow_mode: Option<bool>,
    #[serde(default)]
    pub slow_mode_wait_time: Option<u64>,
    #[serde(default)]
    pub subscriber_mode: Option<bool>,
    #[serde(default)]
    pub unique_chat_mode: Option<bool>,
}

#[tauri::command]
pub async fn update_chat_settings(
    app: tauri::AppHandle,
    params: UpdateChatSettingsParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;

    let request = UpdateChatSettingsRequest::new(
        params.broadcaster_id.as_str(),
        token.user_id.as_str(),
    );

    let mut body = UpdateChatSettingsBody::default();
    body.emote_mode = params.emote_mode;
    body.follower_mode = params.follower_mode;
    body.follower_mode_duration = params.follower_mode_duration;
    body.slow_mode = params.slow_mode;
    body.slow_mode_wait_time = params.slow_mode_wait_time;
    body.subscriber_mode = params.subscriber_mode;
    body.unique_chat_mode = params.unique_chat_mode;

    helix()
        .req_patch(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#update-user-chat-color
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserChatColorParams {
    pub color: String,
}

#[tauri::command]
pub async fn update_user_chat_color(
    app: tauri::AppHandle,
    params: UpdateUserChatColorParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    let color: NamedUserColor<'static> = match params.color.to_lowercase().replace('-', "_").as_str() {
        "blue" => NamedUserColor::Blue,
        "blue_violet" => NamedUserColor::BlueViolet,
        "cadet_blue" => NamedUserColor::CadetBlue,
        "chocolate" => NamedUserColor::Chocolate,
        "coral" => NamedUserColor::Coral,
        "dodger_blue" => NamedUserColor::DodgerBlue,
        "firebrick" => NamedUserColor::Firebrick,
        "golden_rod" => NamedUserColor::GoldenRod,
        "green" => NamedUserColor::Green,
        "hot_pink" => NamedUserColor::HotPink,
        "orange_red" => NamedUserColor::OrangeRed,
        "red" => NamedUserColor::Red,
        "sea_green" => NamedUserColor::SeaGreen,
        "spring_green" => NamedUserColor::SpringGreen,
        "yellow_green" => NamedUserColor::YellowGreen,
        other => return Err(format!("invalid color: {other}")),
    };
    let request = UpdateUserChatColorRequest::new(token.user_id.as_str(), color);
    helix()
        .req_put(request, EmptyBody, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
