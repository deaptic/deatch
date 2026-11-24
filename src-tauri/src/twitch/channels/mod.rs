pub mod commands;
pub mod dto;

use super::Authed;
use crate::platform::error::{Error, Result};
use crate::twitch::client::ids::{GameId, UserId};
use crate::twitch::client::params::{BroadcasterParams, BroadcasterUserParams};
use dto::{ChannelDetails, ChannelInfo, ContentLabel, Follower, FollowersPage};
use serde::Deserialize;
use std::borrow::Cow;
use twitch_api::helix::ccls::GetContentClassificationLabelsRequest;
use twitch_api::helix::channels::{
    get_followed_channels::GetFollowedChannels,
    modify_channel_information::{
        ContentClassificationLabel, ModifyChannelInformationBody, ModifyChannelInformationRequest,
    },
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
    crate::twitch::client::pagination::collect(
        twitch.helix.get_channels_from_ids(&ids, &twitch.token),
    )
    .await
}

pub async fn get_channel_details(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Option<ChannelDetails>> {
    let ids: types::Collection<'_, types::UserId> =
        vec![types::UserId::from(params.broadcaster_id.as_str())].into();
    let mut channels: Vec<ChannelDetails> = crate::twitch::client::pagination::collect(
        twitch.helix.get_channels_from_ids(&ids, &twitch.token),
    )
    .await?;
    Ok(channels.pop())
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetContentLabelsParams {
    pub locale: String,
}

pub async fn get_content_labels(
    twitch: &Authed<'_>,
    params: GetContentLabelsParams,
) -> Result<Vec<ContentLabel>> {
    let request = GetContentClassificationLabelsRequest::locale(params.locale);
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(ContentLabel::from).collect())
}

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

const FOLLOWERS_PAGE: usize = 100;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetFollowersParams {
    pub broadcaster_id: UserId,
    #[serde(default)]
    pub cursor: Option<String>,
}

pub async fn get_followers(
    twitch: &Authed<'_>,
    params: GetFollowersParams,
) -> Result<FollowersPage> {
    let mut request = GetChannelFollowersRequest::broadcaster_id(params.broadcaster_id.as_str())
        .first(FOLLOWERS_PAGE);
    request.after = params
        .cursor
        .map(|c| twitch_api::helix::Cursor::from(c).into());
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(FollowersPage {
        total: response.get_other("total").ok().flatten(),
        cursor: response.pagination_data.cursor.map(|c| c.to_string()),
        followers: response.data.into_iter().map(Follower::from).collect(),
    })
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ModifyChannelInformationParams {
    pub broadcaster_id: UserId,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub game_id: Option<GameId>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub content_labels: Option<Vec<ContentLabelChange>>,
    #[serde(default)]
    pub branded_content: Option<bool>,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ContentLabelChange {
    pub id: String,
    pub enabled: bool,
}

fn content_label(change: &ContentLabelChange) -> Result<ContentClassificationLabel> {
    let id: types::ContentClassificationId =
        serde_json::from_value(serde_json::Value::String(change.id.clone()))
            .map_err(|e| Error::Invalid(format!("unknown content label {}: {e}", change.id)))?;
    Ok(ContentClassificationLabel::new(change.enabled, id))
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
    let tags: Option<Vec<&str>> = params
        .tags
        .as_ref()
        .map(|tags| tags.iter().map(String::as_str).collect());
    if let Some(tags) = &tags {
        body.tags = Some(Cow::Borrowed(tags.as_slice()));
    }
    if let Some(changes) = &params.content_labels {
        let labels = changes
            .iter()
            .map(content_label)
            .collect::<Result<Vec<_>>>()?;
        body.content_classification_labels = Some(Cow::Owned(labels));
    }
    body.is_branded_content = params.branded_content;
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

pub async fn add_channel_moderator(
    twitch: &Authed<'_>,
    params: BroadcasterUserParams,
) -> Result<()> {
    twitch
        .helix
        .add_channel_moderator(
            params.broadcaster_id.as_str(),
            params.user_id.as_str(),
            &twitch.token,
        )
        .await?;
    Ok(())
}

pub async fn remove_channel_moderator(
    twitch: &Authed<'_>,
    params: BroadcasterUserParams,
) -> Result<()> {
    twitch
        .helix
        .remove_channel_moderator(
            params.broadcaster_id.as_str(),
            params.user_id.as_str(),
            &twitch.token,
        )
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{content_label, ContentLabelChange, StartCommercialParams};
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

    #[test]
    fn content_label_changes_use_twitch_ids() {
        let label = content_label(&ContentLabelChange {
            id: "Gambling".into(),
            enabled: true,
        })
        .unwrap();
        assert_eq!(
            serde_json::to_value(&label).unwrap(),
            json!({ "is_enabled": true, "id": "Gambling" })
        );
    }
}
