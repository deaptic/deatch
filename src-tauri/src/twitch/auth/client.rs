use crate::http::log_request;
use std::future::Future;
use std::time::Instant;
use twitch_api::twitch_oauth2::client::Client;

#[derive(Clone)]
pub struct OAuthClient(reqwest::Client);

impl OAuthClient {
    pub fn new(http: reqwest::Client) -> Self {
        Self(http)
    }
}

impl Client for OAuthClient {
    type Error = reqwest::Error;

    fn req(
        &self,
        request: http::Request<Vec<u8>>,
    ) -> impl Future<Output = Result<http::Response<Vec<u8>>, Self::Error>> + Send + use<> {
        let method = request.method().clone();
        let uri = request.uri().clone();
        let response = self.0.req(request);
        async move {
            let started = Instant::now();
            let result = response.await;
            log_request(
                &method,
                uri.host().unwrap_or_default(),
                uri.path(),
                started,
                result.as_ref().map(|r| (r.status(), r.body().as_slice())),
            );
            result
        }
    }
}
