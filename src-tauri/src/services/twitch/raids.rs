use super::Authed;
use crate::error::Result;
use twitch_api::helix::raids::{CancelARaidRequest, StartARaidRequest};
use twitch_api::helix::EmptyBody;

pub async fn start_raid(
    twitch: &Authed<'_>,
    from_broadcaster_id: String,
    to_broadcaster_id: String,
) -> Result<()> {
    let request = StartARaidRequest::new(from_broadcaster_id.as_str(), to_broadcaster_id.as_str());
    twitch
        .helix
        .req_post(request, EmptyBody, &twitch.token)
        .await?;
    Ok(())
}

pub async fn cancel_raid(twitch: &Authed<'_>, broadcaster_id: String) -> Result<()> {
    let request = CancelARaidRequest::broadcaster_id(broadcaster_id.as_str());
    twitch.helix.req_delete(request, &twitch.token).await?;
    Ok(())
}
