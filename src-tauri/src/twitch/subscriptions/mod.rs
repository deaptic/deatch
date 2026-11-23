pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use crate::twitch::params::BroadcasterUserParams;
use dto::Subscription;
use twitch_api::helix::subscriptions::GetBroadcasterSubscriptionsRequest;
use twitch_api::types;

pub async fn get_subscription(
    twitch: &Authed<'_>,
    params: BroadcasterUserParams,
) -> Result<Option<Subscription>> {
    let request =
        GetBroadcasterSubscriptionsRequest::broadcaster_id(params.broadcaster_id.as_str())
            .subscriber(vec![types::UserId::from(params.user_id.as_str())]);
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().find_map(Subscription::from_helix))
}
