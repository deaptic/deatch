pub mod commands;
pub mod dto;

use super::Authed;
use crate::platform::error::Result;
use crate::twitch::client::params::BroadcasterParams;
use dto::LastStream;
use twitch_api::helix::videos::get_videos::GetVideosRequest;
use twitch_api::helix::videos::VideoTypeFilter;

pub async fn last_stream(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Option<LastStream>> {
    let mut request = GetVideosRequest::user_id(params.broadcaster_id.as_str());
    request.type_ = Some(VideoTypeFilter::Archive);
    request.first = Some(1);
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().next().map(LastStream::from))
}
