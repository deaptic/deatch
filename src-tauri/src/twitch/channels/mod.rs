pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::{Error, Result};
use crate::twitch::ids::{GameId, UserId};
use crate::twitch::params::BroadcasterUserParams;
use dto::ChannelInfo;
use serde::Deserialize;
use std::borrow::Cow;
use twitch_api::helix::channels::{
    get_followed_channels::GetFollowedChannels,
    modify_channel_information::{ModifyChannelInformationBody, ModifyChannelInformationRequest},
    start_commercial::{StartCommercialBody, StartCommercialRequest},
    GetChannelFollowersRequest,
};
use twitch_api::types;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetChannelInformationParams {
    pub broadcaster_ids: Vec<UserId>,
}

pub async fn get_channel_information(
    twitch: &Authed<'_>,
    params: GetChannelInformationParams,
) -> Result<Vec<ChannelInfo>> {
    let ids: Vec<types::UserId> = params.broadcaster_ids.into_iter().map(Into::into).collect();
    let ids = ids.into();
    crate::twitch::pagination::collect(twitch.helix.get_channels_from_ids(&ids, &twitch.token))
        .await
}

/// Your own follows are readable for any channel; anyone else's need the
/// channel's moderator view.
pub async fn get_followed_at(
    twitch: &Authed<'_>,
    params: BroadcasterUserParams,
) -> Result<Option<String>> {
    let broadcaster_id = params.broadcaster_id.as_str();
    let followed_at = if params.user_id.as_str() == twitch.token.user_id.as_str() {
        let request =
            GetFollowedChannels::user_id(params.user_id.as_str()).broadcaster_id(broadcaster_id);
        let response = twitch.helix.req_get(request, &twitch.token).await?;
        response.data.into_iter().next().map(|f| f.followed_at)
    } else {
        let mut request = GetChannelFollowersRequest::broadcaster_id(broadcaster_id);
        request.user_id = Some(Cow::Owned(params.user_id.into()));
        let response = twitch.helix.req_get(request, &twitch.token).await?;
        response.data.into_iter().next().map(|f| f.followed_at)
    };
    Ok(followed_at.map(|t| t.to_string()))
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ModifyChannelInformationParams {
    pub broadcaster_id: UserId,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
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
        body.game_id = Some(Cow::Owned(g.into()));
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

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct StartCommercialParams {
    pub broadcaster_id: UserId,
    #[specta(type = u64)]
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

pub async fn add_channel_vip(twitch: &Authed<'_>, params: BroadcasterUserParams) -> Result<()> {
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

pub async fn remove_channel_vip(twitch: &Authed<'_>, params: BroadcasterUserParams) -> Result<()> {
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

#[cfg(test)]
mod tests {
    use super::StartCommercialParams;
    use serde_json::json;
    use twitch_api::types;

    fn commercial(length: u64) -> serde_json::Result<StartCommercialParams> {
        serde_json::from_value(json!({ "broadcasterId": "1", "length": length }))
    }

    #[test]
    fn accepts_every_twitch_commercial_length() {
        for seconds in [30, 60, 90, 120, 150, 180] {
            let length = types::CommercialLength::from(commercial(seconds).unwrap().length);
            assert_eq!(length as u64, seconds);
        }
    }

    #[test]
    fn rejects_other_commercial_lengths() {
        assert!(commercial(45).is_err());
        assert!(commercial(0).is_err());
    }
}
