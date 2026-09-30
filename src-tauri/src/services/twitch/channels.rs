use super::Authed;
use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::channel::{ChannelInfo, Follow};
use crate::error::{Error, Result};
use std::borrow::Cow;
use twitch_api::helix::channels::{
    get_followed_channels::GetFollowedChannels,
    modify_channel_information::{ModifyChannelInformationBody, ModifyChannelInformationRequest},
    start_commercial::{StartCommercialBody, StartCommercialRequest},
    AddChannelVipRequest, GetChannelFollowersRequest, GetChannelInformationRequest,
    RemoveChannelVipRequest,
};
use twitch_api::helix::EmptyBody;
use twitch_api::types::{CategoryId, CommercialLength, UserId};

const HELIX_ID_BATCH: usize = 100;

pub async fn get_channel_information(
    twitch: &Authed<'_>,
    broadcaster_ids: Vec<String>,
) -> Result<Vec<ChannelInfo>> {
    let mut out = Vec::with_capacity(broadcaster_ids.len());
    for chunk in broadcaster_ids.chunks(HELIX_ID_BATCH) {
        let ids: Vec<UserId> = chunk.iter().cloned().map(UserId::from).collect();
        let request = GetChannelInformationRequest::broadcaster_ids(&*ids);
        let response = twitch.helix.req_get(request, &twitch.token).await?;
        out.extend(response.data.into_iter().map(ChannelInfo::from));
    }
    Ok(out)
}

pub async fn get_channel_followers(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    user_id: Option<String>,
    first: Option<usize>,
    after: Option<String>,
) -> Result<PaginatedResponse<Follow>> {
    let mut request = GetChannelFollowersRequest::broadcaster_id(UserId::from(broadcaster_id));
    if let Some(uid) = user_id {
        request.user_id = Some(UserId::from(uid).into());
    }
    request.first = first;
    request.after = super::cursor(after);

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(super::into_paginated(response, Follow::from))
}

pub async fn get_followed_channels(
    twitch: &Authed<'_>,
    user_id: String,
    broadcaster_id: Option<String>,
) -> Result<Vec<Follow>> {
    let mut request = GetFollowedChannels::user_id(user_id.as_str());
    if let Some(bid) = broadcaster_id.as_deref() {
        request = request.broadcaster_id(bid);
    }
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(Follow::from).collect())
}

pub async fn modify_channel_information(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    title: Option<String>,
    game_id: Option<String>,
) -> Result<()> {
    let request = ModifyChannelInformationRequest::broadcaster_id(broadcaster_id.as_str());
    let mut body = ModifyChannelInformationBody::default();
    if let Some(t) = title.as_deref().filter(|s| !s.is_empty()) {
        body.title = Some(Cow::Borrowed(t));
    }
    if let Some(g) = game_id.filter(|s| !s.is_empty()) {
        body.game_id = Some(Cow::Owned(CategoryId::new(g)));
    }
    twitch.helix.req_patch(request, body, &twitch.token).await?;
    Ok(())
}

pub async fn start_commercial(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    length: u64,
) -> Result<()> {
    let length = CommercialLength::try_from(length).map_err(|e| Error::Invalid(e.to_string()))?;
    let request = StartCommercialRequest::new();
    let body = StartCommercialBody::new(broadcaster_id.as_str(), length);
    twitch.helix.req_post(request, body, &twitch.token).await?;
    Ok(())
}

pub async fn add_channel_vip(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    user_id: String,
) -> Result<()> {
    let request = AddChannelVipRequest::new(broadcaster_id.as_str(), user_id.as_str());
    twitch
        .helix
        .req_post(request, EmptyBody, &twitch.token)
        .await?;
    Ok(())
}

pub async fn remove_channel_vip(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    user_id: String,
) -> Result<()> {
    let request = RemoveChannelVipRequest::new(broadcaster_id.as_str(), user_id.as_str());
    twitch.helix.req_delete(request, &twitch.token).await?;
    Ok(())
}
