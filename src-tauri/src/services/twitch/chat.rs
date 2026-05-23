use crate::dto::twitch::chat::{BadgeSet, Emote, SendMessageResult, UserEmote};
use super::helix;
use crate::dto::pagination::PaginatedResponse;
use std::borrow::Cow;
use twitch_api::helix::chat::{
    send_a_shoutout::SendAShoutoutRequest,
    send_chat_announcement::{SendChatAnnouncementBody, SendChatAnnouncementRequest},
    send_chat_message::{SendChatMessageBody, SendChatMessageRequest},
    update_chat_settings::{UpdateChatSettingsBody, UpdateChatSettingsRequest},
    update_user_chat_color::UpdateUserChatColorRequest,
    GetChannelChatBadgesRequest, GetGlobalChatBadgesRequest, GetGlobalEmotesRequest,
    GetUserEmotesRequest,
};
use twitch_api::helix::{Cursor, EmptyBody};
use twitch_api::twitch_oauth2::UserToken;
use twitch_api::types::{MsgId, NamedUserColor, UserId};

pub struct ChatSettings {
    pub emote_mode: Option<bool>,
    pub follower_mode: Option<bool>,
    pub follower_mode_duration: Option<u64>,
    pub slow_mode: Option<bool>,
    pub slow_mode_wait_time: Option<u64>,
    pub subscriber_mode: Option<bool>,
    pub unique_chat_mode: Option<bool>,
}

pub async fn get_global_emotes(token: &UserToken) -> Result<Vec<Emote>, String> {
    helix()
        .req_get(GetGlobalEmotesRequest::new(), token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data.into_iter().map(Emote::from).collect())
}

pub async fn get_user_emotes(
    token: &UserToken,
    broadcaster_id: Option<String>,
    after: Option<String>,
) -> Result<PaginatedResponse<UserEmote>, String> {
    let mut request = GetUserEmotesRequest::user_id(token.user_id.clone());
    request.broadcaster_id = broadcaster_id.map(|s| Cow::Owned(UserId::from(s)));
    request.after = after.map(|s| Cow::Owned(Cursor::from(s)));

    let response = helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(
        response.data.into_iter().map(UserEmote::from).collect(),
        response.pagination.map(|c| c.as_str().to_string()),
    ))
}

pub async fn get_global_chat_badges(token: &UserToken) -> Result<Vec<BadgeSet>, String> {
    helix()
        .req_get(GetGlobalChatBadgesRequest::new(), token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data.into_iter().map(BadgeSet::from).collect())
}

pub async fn get_channel_chat_badges(
    token: &UserToken,
    broadcaster_id: String,
) -> Result<Vec<BadgeSet>, String> {
    let request = GetChannelChatBadgesRequest::broadcaster_id(broadcaster_id.as_str());
    helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data.into_iter().map(BadgeSet::from).collect())
}

pub async fn send_shoutout(
    token: &UserToken,
    from_broadcaster_id: String,
    to_broadcaster_id: String,
) -> Result<(), String> {
    let request = SendAShoutoutRequest::new(
        from_broadcaster_id.as_str(),
        to_broadcaster_id.as_str(),
        token.user_id.as_str(),
    );
    helix()
        .req_post(request, EmptyBody, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub async fn send_chat_message(
    token: &UserToken,
    broadcaster_id: String,
    message: String,
    reply_parent_message_id: Option<String>,
) -> Result<SendMessageResult, String> {
    let request = SendChatMessageRequest::new();
    let mut body = SendChatMessageBody::new(
        broadcaster_id.as_str(),
        token.user_id.as_str(),
        message.as_str(),
    );
    body.reply_parent_message_id = reply_parent_message_id.map(|s| Cow::Owned(MsgId::from(s)));
    helix()
        .req_post(request, body, token)
        .await
        .map(|r| SendMessageResult::from(r.data))
        .map_err(|e| e.to_string())
}

pub async fn send_chat_announcement(
    token: &UserToken,
    broadcaster_id: String,
    message: String,
    color: Option<String>,
) -> Result<(), String> {
    let request =
        SendChatAnnouncementRequest::new(broadcaster_id.as_str(), token.user_id.as_str());
    let color = color.as_deref().unwrap_or("primary");
    let body = SendChatAnnouncementBody::new(message.as_str(), color)
        .map_err(|e| format!("invalid announcement color: {e}"))?;
    helix()
        .req_post(request, body, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub async fn update_chat_settings(
    token: &UserToken,
    broadcaster_id: String,
    settings: ChatSettings,
) -> Result<(), String> {
    let request = UpdateChatSettingsRequest::new(broadcaster_id.as_str(), token.user_id.as_str());
    let mut body = UpdateChatSettingsBody::default();
    body.emote_mode = settings.emote_mode;
    body.follower_mode = settings.follower_mode;
    body.follower_mode_duration = settings.follower_mode_duration;
    body.slow_mode = settings.slow_mode;
    body.slow_mode_wait_time = settings.slow_mode_wait_time;
    body.subscriber_mode = settings.subscriber_mode;
    body.unique_chat_mode = settings.unique_chat_mode;
    helix()
        .req_patch(request, body, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub async fn update_user_chat_color(token: &UserToken, color: String) -> Result<(), String> {
    let color: NamedUserColor<'static> = match color.to_lowercase().replace('-', "_").as_str() {
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
        .req_put(request, EmptyBody, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
