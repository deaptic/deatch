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
            rate_limit: Arc::default(),
        }
    }

    pub fn paused_for(&self) -> Option<std::time::Duration> {
        self.rate_limit.paused_for()
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
                let result = this
                    .http
                    .req(rebuild(&parts, &body))
                    .await
                    .map_err(reqwest::Error::without_url);
                log_request(
                    &parts.method,
                    parts.uri.host().unwrap_or_default(),
                    parts.uri.path(),
                    started,
                    result.as_ref().map(|r| (r.status(), r.body().as_ref())),
                );
                let response = result?;
                this.rate_limit.observe(response.headers());
                let Some(delay) = retry::retry_delay(&parts.method, response.status(), attempt)
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

#[cfg(test)]
mod tests {
    use super::HelixTransport;
    use twitch_api::HttpClient;

    #[test]
    fn failed_requests_never_expose_the_query() {
        let transport = HelixTransport::new(crate::http::client().unwrap());
        let request = http::Request::post("http://127.0.0.1:1/oauth2/revoke?token=secret")
            .body(Default::default())
            .unwrap();
        let error = tauri::async_runtime::block_on(transport.req(request))
            .unwrap_err()
            .to_string();
        assert!(!error.contains("secret"), "{error}");
    }
}
