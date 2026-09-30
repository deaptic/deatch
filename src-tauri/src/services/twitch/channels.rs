use super::Authed;
use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::channel::{ChannelInfo, Follow};
use crate::dto::twitch::ids::{GameId, UserId};
use crate::error::{Error, Result};
use serde::Deserialize;
use std::borrow::Cow;
use twitch_api::helix::channels::{
    get_followed_channels::GetFollowedChannels,
    modify_channel_information::{ModifyChannelInformationBody, ModifyChannelInformationRequest},
    start_commercial::{StartCommercialBody, StartCommercialRequest},
    GetChannelFollowersRequest,
};
use twitch_api::types;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetChannelInformationParams {
    pub broadcaster_ids: Vec<UserId>,
}

pub async fn get_channel_information(
    twitch: &Authed<'_>,
    params: GetChannelInformationParams,
) -> Result<Vec<ChannelInfo>> {
    let ids: Vec<types::UserId> = params
        .broadcaster_ids
        .into_iter()
        .map(|id| id.0.into())
        .collect();
    let ids = ids.into();
    super::collect(twitch.helix.get_channels_from_ids(&ids, &twitch.token)).await
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetChannelFollowersParams {
    pub broadcaster_id: UserId,
    pub user_id: Option<UserId>,
    pub first: Option<usize>,
    pub after: Option<String>,
}

pub async fn get_channel_followers(
    twitch: &Authed<'_>,
    params: GetChannelFollowersParams,
) -> Result<PaginatedResponse<Follow>> {
    let mut request = GetChannelFollowersRequest::broadcaster_id(params.broadcaster_id.as_str());
    request.user_id = params
        .user_id
        .map(|id| Cow::Owned(types::UserId::from(id.0)));
    request.first = params.first;
    request.after = super::cursor(params.after);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(super::into_paginated(response, Follow::from))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetFollowedChannelsParams {
    pub user_id: UserId,
    #[serde(default)]
    pub broadcaster_id: Option<UserId>,
}

pub async fn get_followed_channels(
    twitch: &Authed<'_>,
    params: GetFollowedChannelsParams,
) -> Result<Vec<Follow>> {
    let mut request = GetFollowedChannels::user_id(params.user_id.as_str());
    if let Some(bid) = &params.broadcaster_id {
        request = request.broadcaster_id(bid.as_str());
    }
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(Follow::from).collect())
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct ModifyChannelInformationParams {
    pub broadcaster_id: UserId,
    pub title: Option<String>,
    pub game_id: Option<GameId>,
}

pub async fn modify_channel_information(
    twitch: &Authed<'_>,
    params: ModifyChannelInformationParams,
) -> Result<()> {
    let request = ModifyChannelInformationRequest::broadcaster_id(params.broadcaster_id.as_str());
    let mut body = ModifyChannelInformationBody::default();
    if let Some(t) = params.title.as_deref().filter(|s| !s.is_empty()) {
        body.title = Some(Cow::Borrowed(t));
    }
    if let Some(g) = params.game_id.filter(|g| !g.as_str().is_empty()) {
        body.game_id = Some(Cow::Owned(types::CategoryId::new(g.0)));
    }
    twitch.helix.req_patch(request, body, &twitch.token).await?;
    Ok(())
}

#[derive(Clone, Copy, Deserialize)]
#[serde(try_from = "u64")]
pub enum CommercialLength {
    Seconds30,
    Seconds60,
    Seconds90,
    Seconds120,
    Seconds150,
    Seconds180,
}

impl TryFrom<u64> for CommercialLength {
    type Error = Error;

    fn try_from(seconds: u64) -> Result<Self> {
        Ok(match seconds {
            30 => Self::Seconds30,
            60 => Self::Seconds60,
            90 => Self::Seconds90,
            120 => Self::Seconds120,
            150 => Self::Seconds150,
            180 => Self::Seconds180,
            other => {
                return Err(Error::Invalid(format!(
                    "invalid commercial length: {other}"
                )))
            }
        })
    }
}

impl From<CommercialLength> for types::CommercialLength {
    fn from(length: CommercialLength) -> Self {
        match length {
            CommercialLength::Seconds30 => Self::Length30,
            CommercialLength::Seconds60 => Self::Length60,
            CommercialLength::Seconds90 => Self::Length90,
            CommercialLength::Seconds120 => Self::Length120,
            CommercialLength::Seconds150 => Self::Length150,
            CommercialLength::Seconds180 => Self::Length180,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartCommercialParams {
    pub broadcaster_id: UserId,
    pub length: CommercialLength,
}

pub async fn start_commercial(twitch: &Authed<'_>, params: StartCommercialParams) -> Result<()> {
    let body = StartCommercialBody::new(
        params.broadcaster_id.as_str(),
        types::CommercialLength::from(params.length),
    );
    twitch
        .helix
        .req_post(StartCommercialRequest::new(), body, &twitch.token)
        .await?;
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChannelVipParams {
    pub broadcaster_id: UserId,
    pub user_id: UserId,
}

pub async fn add_channel_vip(twitch: &Authed<'_>, params: ChannelVipParams) -> Result<()> {
    twitch
        .helix
        .add_channel_vip(
            params.broadcaster_id.as_str(),
            params.user_id.as_str(),
            &twitch.token,
        )
        .await?;
    Ok(())
}

pub async fn remove_channel_vip(twitch: &Authed<'_>, params: ChannelVipParams) -> Result<()> {
    twitch
        .helix
        .remove_channel_vip(
            params.broadcaster_id.as_str(),
            params.user_id.as_str(),
            &twitch.token,
        )
        .await?;
    Ok(())
}
