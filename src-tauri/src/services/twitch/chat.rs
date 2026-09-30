use super::Authed;
use crate::dto::twitch::chat::{BadgeSet, Emote, SendMessageResult, UserEmote};
use crate::dto::twitch::ids::{MessageId, UserId};
use crate::error::Result;
use serde::Deserialize;
use twitch_api::extra::AnnouncementColor as HelixAnnouncementColor;
use twitch_api::helix::chat::{
    send_a_shoutout::SendAShoutoutRequest,
    send_chat_announcement::{SendChatAnnouncementBody, SendChatAnnouncementRequest},
    update_chat_settings::{UpdateChatSettingsBody, UpdateChatSettingsRequest},
    GetChannelChatBadgesRequest, GetGlobalChatBadgesRequest,
};
use twitch_api::helix::EmptyBody;
use twitch_api::types::NamedUserColor;

pub async fn get_global_emotes(twitch: &Authed<'_>) -> Result<Vec<Emote>> {
    let emotes = twitch.helix.get_global_emotes(&twitch.token).await?;
    Ok(emotes.into_iter().map(Emote::from).collect())
}

pub async fn get_user_emotes(twitch: &Authed<'_>) -> Result<Vec<UserEmote>> {
    super::collect(
        twitch
            .helix
            .get_user_emotes(&twitch.token.user_id, &twitch.token),
    )
    .await
}

pub async fn get_global_chat_badges(twitch: &Authed<'_>) -> Result<Vec<BadgeSet>> {
    let response = twitch
        .helix
        .req_get(GetGlobalChatBadgesRequest::new(), &twitch.token)
        .await?;
    Ok(response.data.into_iter().map(BadgeSet::from).collect())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetChannelChatBadgesParams {
    pub broadcaster_id: UserId,
}

pub async fn get_channel_chat_badges(
    twitch: &Authed<'_>,
    params: GetChannelChatBadgesParams,
) -> Result<Vec<BadgeSet>> {
    let request = GetChannelChatBadgesRequest::broadcaster_id(params.broadcaster_id.as_str());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(BadgeSet::from).collect())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendShoutoutParams {
    pub from_broadcaster_id: UserId,
    pub to_broadcaster_id: UserId,
}

pub async fn send_shoutout(twitch: &Authed<'_>, params: SendShoutoutParams) -> Result<()> {
    let request = SendAShoutoutRequest::new(
        params.from_broadcaster_id.as_str(),
        params.to_broadcaster_id.as_str(),
        twitch.token.user_id.as_str(),
    );
    twitch
        .helix
        .req_post(request, EmptyBody, &twitch.token)
        .await?;
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendChatMessageParams {
    pub broadcaster_id: UserId,
    pub message: String,
    pub reply_parent_message_id: Option<MessageId>,
}

pub async fn send_chat_message(
    twitch: &Authed<'_>,
    params: SendChatMessageParams,
) -> Result<SendMessageResult> {
    let broadcaster_id = params.broadcaster_id.as_str();
    let sender_id = &twitch.token.user_id;
    let message = params.message.as_str();
    let response = match &params.reply_parent_message_id {
        Some(parent) => {
            twitch
                .helix
                .send_chat_message_reply(
                    broadcaster_id,
                    sender_id,
                    parent.as_str(),
                    message,
                    &twitch.token,
                )
                .await?
        }
        None => {
            twitch
                .helix
                .send_chat_message(broadcaster_id, sender_id, message, &twitch.token)
                .await?
        }
    };
    Ok(SendMessageResult::from(response))
}

#[derive(Clone, Copy, Default, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AnnouncementColor {
    #[default]
    Primary,
    Blue,
    Green,
    Orange,
    Purple,
}

impl From<AnnouncementColor> for HelixAnnouncementColor {
    fn from(color: AnnouncementColor) -> Self {
        match color {
            AnnouncementColor::Primary => Self::Primary,
            AnnouncementColor::Blue => Self::Blue,
            AnnouncementColor::Green => Self::Green,
            AnnouncementColor::Orange => Self::Orange,
            AnnouncementColor::Purple => Self::Purple,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendChatAnnouncementParams {
    pub broadcaster_id: UserId,
    pub message: String,
    #[serde(default)]
    pub color: AnnouncementColor,
}

pub async fn send_chat_announcement(
    twitch: &Authed<'_>,
    params: SendChatAnnouncementParams,
) -> Result<()> {
    let request = SendChatAnnouncementRequest::new(
        params.broadcaster_id.as_str(),
        twitch.token.user_id.as_str(),
    );
    let Ok(body) = SendChatAnnouncementBody::new(
        params.message.as_str(),
        HelixAnnouncementColor::from(params.color),
    );
    twitch.helix.req_post(request, body, &twitch.token).await?;
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChatSettingsParams {
    pub broadcaster_id: UserId,
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

pub async fn update_chat_settings(
    twitch: &Authed<'_>,
    params: UpdateChatSettingsParams,
) -> Result<()> {
    let request = UpdateChatSettingsRequest::new(
        params.broadcaster_id.as_str(),
        twitch.token.user_id.as_str(),
    );
    let mut body = UpdateChatSettingsBody::default();
    body.emote_mode = params.emote_mode;
    body.follower_mode = params.follower_mode;
    body.follower_mode_duration = params.follower_mode_duration;
    body.slow_mode = params.slow_mode;
    body.slow_mode_wait_time = params.slow_mode_wait_time;
    body.subscriber_mode = params.subscriber_mode;
    body.unique_chat_mode = params.unique_chat_mode;
    twitch.helix.req_patch(request, body, &twitch.token).await?;
    Ok(())
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ChatColor {
    Blue,
    BlueViolet,
    CadetBlue,
    Chocolate,
    Coral,
    DodgerBlue,
    Firebrick,
    GoldenRod,
    Green,
    HotPink,
    OrangeRed,
    Red,
    SeaGreen,
    SpringGreen,
    YellowGreen,
}

impl From<ChatColor> for NamedUserColor<'static> {
    fn from(color: ChatColor) -> Self {
        match color {
            ChatColor::Blue => Self::Blue,
            ChatColor::BlueViolet => Self::BlueViolet,
            ChatColor::CadetBlue => Self::CadetBlue,
            ChatColor::Chocolate => Self::Chocolate,
            ChatColor::Coral => Self::Coral,
            ChatColor::DodgerBlue => Self::DodgerBlue,
            ChatColor::Firebrick => Self::Firebrick,
            ChatColor::GoldenRod => Self::GoldenRod,
            ChatColor::Green => Self::Green,
            ChatColor::HotPink => Self::HotPink,
            ChatColor::OrangeRed => Self::OrangeRed,
            ChatColor::Red => Self::Red,
            ChatColor::SeaGreen => Self::SeaGreen,
            ChatColor::SpringGreen => Self::SpringGreen,
            ChatColor::YellowGreen => Self::YellowGreen,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserChatColorParams {
    pub color: ChatColor,
}

pub async fn update_user_chat_color(
    twitch: &Authed<'_>,
    params: UpdateUserChatColorParams,
) -> Result<()> {
    twitch
        .helix
        .update_user_chat_color(
            &twitch.token.user_id,
            NamedUserColor::from(params.color),
            &twitch.token,
        )
        .await?;
    Ok(())
}
