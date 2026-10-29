mod rate_limit;
mod retry;

use crate::http::log_request;
use rate_limit::RateLimit;
use std::future::Future;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;
use twitch_api::client::{Bytes, Request, Response};
use twitch_api::HttpClient;

/// OAuth calls share the transport but answer for a different service, so
/// only Helix responses speak for the rate-limit bucket or the token.
const HELIX_HOST: &str = "api.twitch.tv";
const OAUTH_HOST: &str = "id.twitch.tv";

#[derive(Clone)]
pub struct HelixTransport {
    http: reqwest::Client,
    rate_limit: Arc<RateLimit>,
    unauthorized: Arc<AtomicBool>,
}

impl HelixTransport {
    pub fn new(http: reqwest::Client) -> Self {
        Self {
            http,
            rate_limit: Arc::default(),
            unauthorized: Arc::default(),
        }
    }

    pub fn paused_for(&self) -> Option<std::time::Duration> {
        self.rate_limit.paused_for()
    }

    /// True once since the last call if Twitch rejected a token that still
    /// looked valid by its expiry, so the session can refresh it early.
    pub fn take_unauthorized(&self) -> bool {
        self.unauthorized.swap(false, Ordering::Relaxed)
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
                    client_error_level(parts.uri.host()),
                );
                let response = result?;
                this.rate_limit
                    .observe(parts.uri.host(), response.headers());
                if parts.uri.host() == Some(HELIX_HOST)
                    && response.status() == http::StatusCode::UNAUTHORIZED
                {
                    this.unauthorized.store(true, Ordering::Relaxed);
                }
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

fn client_error_level(host: Option<&str>) -> log::Level {
    if host == Some(OAUTH_HOST) {
        log::Level::Debug
    } else {
        log::Level::Warn
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
    use super::{client_error_level, HelixTransport, HELIX_HOST, OAUTH_HOST};
    use twitch_api::HttpClient;

    #[test]
    fn oauth_rejections_stay_quiet_because_device_polls_expect_them() {
        assert_eq!(client_error_level(Some(OAUTH_HOST)), log::Level::Debug);
        assert_eq!(client_error_level(Some(HELIX_HOST)), log::Level::Warn);
        assert_eq!(client_error_level(None), log::Level::Warn);
    }

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
