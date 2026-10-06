mod rate_limit;
mod retry;

use crate::http::log_request;
use rate_limit::RateLimit;
use std::future::Future;
use std::sync::Arc;
use std::time::Instant;
use twitch_api::client::{Bytes, Request, Response};
use twitch_api::HttpClient;

#[derive(Clone)]
pub struct HelixTransport {
    http: reqwest::Client,
    rate_limit: Arc<RateLimit>,
}

impl HelixTransport {
    pub fn new(http: reqwest::Client) -> Self {
        Self {
            http,
            rate_limit: Arc::new(RateLimit::new()),
        }
    }
}

impl HttpClient for HelixTransport {
    type Error = reqwest::Error;

    fn req(
        &self,
        request: Request,
    ) -> impl Future<Output = Result<Response, Self::Error>> + Send + use<> {
        let this = self.clone();
        async move {
            let (parts, body) = request.into_parts();
            let mut attempt = 0;
            loop {
                this.rate_limit.wait().await;
                let started = Instant::now();
                let result = this.http.req(rebuild(&parts, &body)).await;
                log_request(
                    &parts.method,
                    parts.uri.host().unwrap_or_default(),
                    parts.uri.path(),
                    started,
                    result.as_ref().map(|r| (r.status(), r.body().as_ref())),
                );
                let response = result?;
                this.rate_limit.observe(response.headers());
                let reset_in = RateLimit::reset_in(response.headers());
                let Some(delay) =
                    retry::retry_delay(&parts.method, response.status(), reset_in, attempt)
                else {
                    return Ok(response);
                };
                log::warn!(
                    "helix {} {} returned {}, retrying in {delay:?}",
                    parts.method,
                    parts.uri.path(),
                    response.status()
                );
                tokio::time::sleep(delay).await;
                attempt += 1;
            }
        }
    }
}

fn rebuild(parts: &http::request::Parts, body: &Bytes) -> Request {
    let mut request = http::Request::new(body.clone());
    *request.method_mut() = parts.method.clone();
    *request.uri_mut() = parts.uri.clone();
    *request.version_mut() = parts.version;
    *request.headers_mut() = parts.headers.clone();
    request
}
