pub mod commands;
pub mod dto;

use super::Authed;
use crate::platform::error::Result;
use crate::twitch::client::params::BroadcasterParams;
use dto::CharityCampaign;
use twitch_api::helix::charity::GetCharityCampaignRequest;
use twitch_api::helix::{ClientRequestError, HelixRequestGetError};

pub async fn get_charity_campaign(
    twitch: &Authed<'_>,
    params: BroadcasterParams,
) -> Result<Option<CharityCampaign>> {
    let request = GetCharityCampaignRequest::broadcaster_id(params.broadcaster_id.as_str());
    match twitch.helix.req_get(request, &twitch.token).await {
        Ok(response) => Ok(response.data.into_iter().next().map(CharityCampaign::from)),
        Err(ClientRequestError::HelixRequestGetError(HelixRequestGetError::DeserializeError(
            body,
            ..,
        ))) if has_no_campaign(&body) => Ok(None),
        Err(error) => Err(error.into()),
    }
}

fn has_no_campaign(body: &str) -> bool {
    serde_json::from_str::<serde_json::Value>(body)
        .is_ok_and(|value| value["data"].as_array().is_some_and(Vec::is_empty))
}

#[cfg(test)]
mod tests {
    use super::has_no_campaign;

    #[test]
    fn an_empty_list_means_no_campaign_is_running() {
        assert!(has_no_campaign(r#"{"data":[]}"#));
        assert!(!has_no_campaign(r#"{"data":[{"id":"1"}]}"#));
        assert!(!has_no_campaign("not json"));
    }
}
