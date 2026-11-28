use crate::platform::error::Result;
use crate::twitch::Authed;
use serde::de::DeserializeOwned;
use serde::Serialize;
use std::marker::PhantomData;
use twitch_api::helix::{EmptyBody, Request, RequestGet, RequestPost};
use twitch_api::twitch_oauth2::Validator;

pub trait BroadcasterEndpoint {
    const PATH: &'static str;
    const SCOPE: Validator;
    type Response: DeserializeOwned + PartialEq;
}

#[derive(Serialize)]
#[serde(bound = "")]
pub struct BroadcasterRequest<'a, E> {
    broadcaster_id: &'a str,
    #[serde(skip)]
    endpoint: PhantomData<E>,
}

impl<E: BroadcasterEndpoint> Request for BroadcasterRequest<'_, E> {
    type PaginationData = ();
    type Response = E::Response;

    const PATH: &'static str = E::PATH;
    const SCOPE: Validator = E::SCOPE;
}

impl<E: BroadcasterEndpoint> RequestGet for BroadcasterRequest<'_, E> {}

impl<E: BroadcasterEndpoint> RequestPost for BroadcasterRequest<'_, E> {
    type Body = EmptyBody;
}

pub fn request<E>(broadcaster_id: &str) -> BroadcasterRequest<'_, E> {
    BroadcasterRequest {
        broadcaster_id,
        endpoint: PhantomData,
    }
}

pub async fn get<E: BroadcasterEndpoint>(
    twitch: &Authed<'_>,
    broadcaster_id: &str,
) -> Result<E::Response> {
    let response = twitch
        .helix
        .req_get(request::<E>(broadcaster_id), &twitch.token)
        .await?;
    Ok(response.data)
}

pub async fn post<E: BroadcasterEndpoint>(twitch: &Authed<'_>, broadcaster_id: &str) -> Result<()> {
    twitch
        .helix
        .req_post(request::<E>(broadcaster_id), EmptyBody, &twitch.token)
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{request, BroadcasterEndpoint};
    use twitch_api::helix::Request;
    use twitch_api::twitch_oauth2::{validator, Scope, Validator};

    struct Example;

    impl BroadcasterEndpoint for Example {
        const PATH: &'static str = "goals";
        const SCOPE: Validator = validator![Scope::ChannelReadGoals];
        type Response = Vec<serde_json::Value>;
    }

    #[test]
    fn asks_for_the_endpoint_with_only_the_broadcaster() {
        let uri = request::<Example>("123").get_uri().unwrap();
        assert_eq!(
            uri.to_string(),
            "https://api.twitch.tv/helix/goals?broadcaster_id=123"
        );
    }
}
