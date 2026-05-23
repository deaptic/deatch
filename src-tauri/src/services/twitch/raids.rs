use super::helix;
use twitch_api::helix::raids::{CancelARaidRequest, StartARaidRequest};
use twitch_api::helix::EmptyBody;
use twitch_api::twitch_oauth2::UserToken;

pub async fn start_raid(
    token: &UserToken,
    from_broadcaster_id: String,
    to_broadcaster_id: String,
) -> Result<(), String> {
    let request =
        StartARaidRequest::new(from_broadcaster_id.as_str(), to_broadcaster_id.as_str());
    helix()
        .req_post(request, EmptyBody, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub async fn cancel_raid(token: &UserToken, broadcaster_id: String) -> Result<(), String> {
    let request = CancelARaidRequest::broadcaster_id(broadcaster_id.as_str());
    helix()
        .req_delete(request, token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
