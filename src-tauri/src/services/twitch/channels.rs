use super::helix;
use crate::dto::pagination::PaginatedResponse;
use crate::dto::twitch::channel::{ChannelInfo, Follow};
use std::borrow::Cow;
use twitch_api::helix::channels::{
    get_followed_channels::GetFollowedChannels,
    modify_channel_information::{ModifyChannelInformationBody, ModifyChannelInformationRequest},
    start_commercial::{StartCommercialBody, StartCommercialRequest},
    AddChannelVipRequest, GetChannelFollowersRequest, GetChannelInformationRequest,
    RemoveChannelVipRequest,
};

const HELIX_ID_BATCH: usize = 100;

pub async fn get_channel_information(
    token: &UserToken,
    broadcaster_ids: Vec<String>,
) -> Result<Vec<ChannelInfo>, String> {
    let mut out = Vec::with_capacity(broadcaster_ids.len());
    for chunk in broadcaster_ids.chunks(HELIX_ID_BATCH) {
        let ids: Vec<UserId> = chunk.iter().cloned().map(UserId::from).collect();
        let request = GetChannelInformationRequest::broadcaster_ids(&*ids);
        let response = helix()
            .req_get(request, token)
            .await
            .map_err(|e| e.to_string())?;
        out.extend(response.data.into_iter().map(ChannelInfo::from));
    }
    Ok(out)
}
use twitch_api::helix::EmptyBody;
use twitch_api::twitch_oauth2::UserToken;
use twitch_api::types::{CategoryId, CommercialLength, UserId};

pub async fn get_channel_followers(
    token: &UserToken,
    broadcaster_id: String,
    user_id: Option<String>,
    first: Option<usize>,
    after: Option<String>,
) -> Result<PaginatedResponse<Follow>, String> {
    let mut request = GetChannelFollowersRequest::broadcaster_id(UserId::from(broadcaster_id));
    if let Some(uid) = user_id {
        request.user_id = Some(UserId::from(uid).into());
    }
    request.first = first;
    request.after = super::cursor(after);

    let response = helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(super::into_paginated(response, Follow::from))
}

pub async fn get_followed_channels(
    token: &UserToken,
    user_id: String,
    broadcaster_id: Option<String>,
) -> Result<Vec<Follow>, String> {
    let mut request = GetFollowedChannels::user_id(user_id.as_str());
    if let Some(bid) = broadcaster_id.as_deref() {
        request = request.broadcaster_id(bid);
    }
    helix()
        .req_get(request, token)
        .await
        .map(|r| r.data.into_iter().map(Follow::from).collect())
        .map_err(|e| e.to_string())
}

pub async fn modify_channel_information(
    token: &UserToken,
    broadcaster_id: String,
    title: Option<String>,
    game_id: Option<String>,
) -> Result<(), String> {
    let request = ModifyChannelInformationRequest::broadcaster_id(broadcaster_id.as_str());
    let mut body = ModifyChannelInformationBody::default();
    if let Some(t) = title.as_deref().filter(|s| !s.is_empty()) {
        body.title = Some(Cow::Borrowed(t));
    }
    if let Some(g) = game_id.filter(|s| !s.is_empty()) {
        body.game_id = Some(Cow::Owned(CategoryId::new(g)));
    }
    helix()
        .req_patch(request, body, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub async fn start_commercial(
    token: &UserToken,
    broadcaster_id: String,
    length: u64,
) -> Result<(), String> {
    let length = CommercialLength::try_from(length).map_err(|e| e.to_string())?;
    let request = StartCommercialRequest::new();
    let body = StartCommercialBody::new(broadcaster_id.as_str(), length);
    helix()
        .req_post(request, body, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub async fn add_channel_vip(
    token: &UserToken,
    broadcaster_id: String,
    user_id: String,
) -> Result<(), String> {
    let request = AddChannelVipRequest::new(broadcaster_id.as_str(), user_id.as_str());
    helix()
        .req_post(request, EmptyBody, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub async fn remove_channel_vip(
    token: &UserToken,
    broadcaster_id: String,
    user_id: String,
) -> Result<(), String> {
    let request = RemoveChannelVipRequest::new(broadcaster_id.as_str(), user_id.as_str());
    helix()
        .req_delete(request, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
