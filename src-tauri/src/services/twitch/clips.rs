use super::helix;
use crate::dto::twitch::clip::CreatedClip;
use serde::Serialize;
use twitch_api::helix::clips::create_clip::CreatedClip as HelixCreatedClip;
use twitch_api::helix::{EmptyBody, Request, RequestPost};
use twitch_api::twitch_oauth2::UserToken;

// `twitch_api` 0.7.2 wires `clips::create_clip::CreateClipRequest` as a GET,
// which hits Get Clips (lists existing clips) instead of Create Clip. It also
// lacks the `title`/`duration` query params. Twitch's Create Clip is
// POST /helix/clips, so we define our own request type.
#[derive(Serialize)]
struct CreateClip<'a> {
    broadcaster_id: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    title: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    duration: Option<f64>,
}

impl Request for CreateClip<'_> {
    type Response = Vec<HelixCreatedClip>;
    const PATH: &'static str = "clips";
    const SCOPE: twitch_api::twitch_oauth2::Validator =
        twitch_api::twitch_oauth2::validator![twitch_api::twitch_oauth2::Scope::ClipsEdit];
}

impl RequestPost for CreateClip<'_> {
    type Body = EmptyBody;
}

pub async fn create_clip(
    token: &UserToken,
    broadcaster_id: String,
    title: Option<String>,
    duration: Option<f64>,
) -> Result<CreatedClip, String> {
    let request = CreateClip {
        broadcaster_id: broadcaster_id.as_str(),
        title: title.as_deref(),
        duration,
    };
    let response = helix()
        .req_post(request, EmptyBody, token)
        .await
        .map_err(|e| e.to_string())?;
    response
        .data
        .into_iter()
        .next()
        .map(CreatedClip::from)
        .ok_or_else(|| "Twitch returned no clip".to_string())
}
