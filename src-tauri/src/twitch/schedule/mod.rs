pub mod commands;
pub mod dto;

use super::Authed;
use crate::platform::error::Result;
use crate::twitch::client::broadcaster_endpoint::{self, BroadcasterEndpoint};
use crate::twitch::client::ids::UserId;
use dto::{HelixSchedule, ScheduledStream};
use futures_util::future::join_all;
use serde::Deserialize;
use twitch_api::helix::{ClientRequestError, HelixRequestGetError};
use twitch_api::twitch_oauth2::{validator, Validator};

struct ScheduleEndpoint;

impl BroadcasterEndpoint for ScheduleEndpoint {
    const PATH: &'static str = "schedule";
    const SCOPE: Validator = validator![];
    type Response = HelixSchedule;
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct GetSchedulesParams {
    pub broadcaster_ids: Vec<UserId>,
}

fn has_no_schedule(error: &ClientRequestError<reqwest::Error>) -> bool {
    let ClientRequestError::HelixRequestGetError(error) = error else {
        return false;
    };
    let status = match error {
        HelixRequestGetError::Error { status, .. }
        | HelixRequestGetError::DeserializeError(_, _, _, status)
        | HelixRequestGetError::InvalidResponse { status, .. } => *status,
        _ => return false,
    };
    status == http::StatusCode::NOT_FOUND
}

async fn upcoming(twitch: &Authed<'_>, broadcaster_id: &UserId) -> Result<Vec<ScheduledStream>> {
    let request = broadcaster_endpoint::request::<ScheduleEndpoint>(broadcaster_id.as_str());
    match twitch.helix.req_get(request, &twitch.token).await {
        Ok(response) => Ok(response
            .data
            .segments
            .unwrap_or_default()
            .into_iter()
            .filter_map(|segment| dto::scheduled(broadcaster_id, segment))
            .collect()),
        Err(error) if has_no_schedule(&error) => Ok(Vec::new()),
        Err(error) => Err(error.into()),
    }
}

pub async fn get_schedules(
    twitch: &Authed<'_>,
    params: GetSchedulesParams,
) -> Result<Vec<ScheduledStream>> {
    let results = join_all(params.broadcaster_ids.iter().map(|id| upcoming(twitch, id))).await;
    let mut streams = Vec::new();
    for (id, result) in params.broadcaster_ids.iter().zip(results) {
        match result {
            Ok(found) => streams.extend(found),
            Err(e) => log::warn!("schedule not loaded broadcaster={id}: {e}"),
        }
    }
    Ok(streams)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn helix_error(status: http::StatusCode) -> ClientRequestError<reqwest::Error> {
        ClientRequestError::HelixRequestGetError(HelixRequestGetError::Error {
            error: String::new(),
            status,
            message: String::new(),
            uri: http::Uri::from_static("https://api.twitch.tv/helix/schedule"),
        })
    }

    #[test]
    fn a_channel_without_a_schedule_is_not_an_error() {
        assert!(has_no_schedule(&helix_error(http::StatusCode::NOT_FOUND)));
        assert!(!has_no_schedule(&helix_error(
            http::StatusCode::INTERNAL_SERVER_ERROR
        )));
    }

    #[test]
    fn a_not_found_body_twitch_api_cannot_read_still_means_no_schedule() {
        let unreadable =
            ClientRequestError::HelixRequestGetError(HelixRequestGetError::InvalidResponse {
                reason: "unexpected body",
                response: r#"{"message":"segments were not found"}"#.into(),
                status: http::StatusCode::NOT_FOUND,
                uri: http::Uri::from_static("https://api.twitch.tv/helix/schedule"),
            });
        assert!(has_no_schedule(&unreadable));
    }
}
