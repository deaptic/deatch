pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use crate::twitch::ids::UserId;
use dto::CreatedClip;
use serde::Deserialize;
use twitch_api::helix::clips::create_clip::CreateClipRequest;
use twitch_api::helix::EmptyBody;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateClipParams {
    pub broadcaster_id: UserId,
    pub title: Option<String>,
    pub duration: Option<f32>,
}

pub async fn create_clip(twitch: &Authed<'_>, params: CreateClipParams) -> Result<CreatedClip> {
    let mut request = CreateClipRequest::broadcaster_id(params.broadcaster_id.as_str());
    if let Some(title) = params.title.as_deref() {
        request = request.title(title);
    }
    if let Some(duration) = params.duration {
        request = request.duration(duration);
    }
    let response = twitch
        .helix
        .req_post(request, EmptyBody, &twitch.token)
        .await?;
    Ok(CreatedClip::from(response.data))
}
