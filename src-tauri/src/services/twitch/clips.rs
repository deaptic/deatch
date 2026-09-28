use super::helix;
use crate::dto::twitch::clip::CreatedClip;
use twitch_api::helix::clips::create_clip::CreateClipRequest;
use twitch_api::helix::EmptyBody;
use twitch_api::twitch_oauth2::UserToken;

pub async fn create_clip(
    token: &UserToken,
    broadcaster_id: String,
    title: Option<String>,
    duration: Option<f64>,
) -> Result<CreatedClip, String> {
    let mut request = CreateClipRequest::broadcaster_id(broadcaster_id.as_str());
    if let Some(title) = title.as_deref() {
        request = request.title(title);
    }
    if let Some(duration) = duration {
        request = request.duration(duration as f32);
    }
    helix()
        .req_post(request, EmptyBody, token)
        .await
        .map(|r| CreatedClip::from(r.data))
        .map_err(|e| e.to_string())
}
