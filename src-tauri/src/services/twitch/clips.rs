use super::Authed;
use crate::dto::twitch::clip::CreatedClip;
use crate::error::Result;
use twitch_api::helix::clips::create_clip::CreateClipRequest;
use twitch_api::helix::EmptyBody;

pub async fn create_clip(
    twitch: &Authed<'_>,
    broadcaster_id: String,
    title: Option<String>,
    duration: Option<f64>,
) -> Result<CreatedClip> {
    let mut request = CreateClipRequest::broadcaster_id(broadcaster_id.as_str());
    if let Some(title) = title.as_deref() {
        request = request.title(title);
    }
    if let Some(duration) = duration {
        request = request.duration(duration as f32);
    }
    let response = twitch
        .helix
        .req_post(request, EmptyBody, &twitch.token)
        .await?;
    Ok(CreatedClip::from(response.data))
}
