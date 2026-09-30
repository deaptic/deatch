use super::Authed;
use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::chat::{BadgeSet, Emote, SendMessageResult, UserEmote};
use crate::error::{Error, Result};
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
use twitch_api::helix::EmptyBody;
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

pub async fn get_global_emotes(twitch: &Authed<'_>) -> Result<Vec<Emote>> {
    let response = twitch
        .helix
        .req_get(GetGlobalEmotesRequest::new(), &twitch.token)
        .await?;
    Ok(response.data.into_iter().map(Emote::from).collect())
}

pub async fn get_user_emotes(
    twitch: &Authed<'_>,
    broadcaster_id: Option<String>,
    after: Option<String>,
) -> Result<PaginatedResponse<UserEmote>> {
    let mut request = GetUserEmotesRequest::user_id(twitch.token.user_id.clone());
    request.broadcaster_id = broadcaster_id.map(|s| Cow::Owned(UserId::from(s)));
    request.after = super::cursor(after);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(super::into_paginated(response, UserEmote::from))
}

pub async fn get_global_chat_badges(twitch: &Authed<'_>) -> Result<Vec<BadgeSet>> {
    let response = twitch
        .helix
        .req_get(GetGlobalChatBadgesRequest::new(), &twitch.token)
        .await?;
    Ok(response.data.into_iter().map(BadgeSet::from).collect())
}

pub async fn get_channel_chat_badges(
    twitch: &Authed<'_>,
    broadcaster_id: String,
) -> Result<Vec<BadgeSet>> {
    let request = GetChannelChatBadgesRequest::broadcaster_id(broadcaster_id.as_str());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(BadgeSet::from).collect())
}

pub async fn send_shoutout(
    twitch: &Authed<'_>,
    from_broadcaster_id: String,
    to_broadcaster_id: String,
) -> Result<()> {
    let request = SendAShoutoutRequest::new(
        from_broadcaster_id.as_str(),
        to_broadcaster_id.as_str(),
        twitch.token.user_id.as_str(),
    );
    twitch
        .helix
        .req_post(request, EmptyBody, &twitch.token)
        .await?;
    Ok(())
}

pub async fn send_chat_message(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    message: String,
    reply_parent_message_id: Option<String>,
) -> Result<SendMessageResult> {
    let request = SendChatMessageRequest::new();
    let mut body = SendChatMessageBody::new(
        broadcaster_id.as_str(),
        twitch.token.user_id.as_str(),
        message.as_str(),
    );
    body.reply_parent_message_id = reply_parent_message_id.map(|s| Cow::Owned(MsgId::from(s)));
    let response = twitch.helix.req_post(request, body, &twitch.token).await?;
    Ok(SendMessageResult::from(response.data))
}

pub async fn send_chat_announcement(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    message: String,
    color: Option<String>,
) -> Result<()> {
    let request =
        SendChatAnnouncementRequest::new(broadcaster_id.as_str(), twitch.token.user_id.as_str());
    let color = color.as_deref().unwrap_or("primary");
    let body = SendChatAnnouncementBody::new(message.as_str(), color)
        .map_err(|e| Error::Invalid(format!("invalid announcement color: {e}")))?;
    twitch.helix.req_post(request, body, &twitch.token).await?;
    Ok(())
}

pub async fn update_chat_settings(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    settings: ChatSettings,
) -> Result<()> {
    let request =
        UpdateChatSettingsRequest::new(broadcaster_id.as_str(), twitch.token.user_id.as_str());
    let mut body = UpdateChatSettingsBody::default();
    body.emote_mode = settings.emote_mode;
    body.follower_mode = settings.follower_mode;
    body.follower_mode_duration = settings.follower_mode_duration;
    body.slow_mode = settings.slow_mode;
    body.slow_mode_wait_time = settings.slow_mode_wait_time;
    body.subscriber_mode = settings.subscriber_mode;
    body.unique_chat_mode = settings.unique_chat_mode;
    twitch.helix.req_patch(request, body, &twitch.token).await?;
    Ok(())
}

pub async fn update_user_chat_color(twitch: &Authed<'_>, color: String) -> Result<()> {
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
        other => return Err(Error::Invalid(format!("invalid color: {other}"))),
    };
    let request = UpdateUserChatColorRequest::new(twitch.token.user_id.as_str(), color);
    twitch
        .helix
        .req_put(request, EmptyBody, &twitch.token)
        .await?;
    Ok(())
}
