use crate::error::Result;
use reqwest::{Method, StatusCode};
use serde::de::DeserializeOwned;
use std::fmt::Display;
use std::time::{Duration, Instant};

const TIMEOUT: Duration = Duration::from_secs(15);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(5);

pub fn client() -> reqwest::Result<reqwest::Client> {
    reqwest::Client::builder()
        .timeout(TIMEOUT)
        .connect_timeout(CONNECT_TIMEOUT)
        .user_agent(concat!("Deatch/", env!("CARGO_PKG_VERSION")))
        .build()
}

pub async fn get_json<T: DeserializeOwned>(http: &reqwest::Client, url: &str) -> Result<T> {
    let request = http.get(url).build()?;
    let target = request.url().clone();
    let started = Instant::now();
    let result = async {
        let response = http.execute(request).await?;
        let status = response.status();
        Ok((status, response.bytes().await?))
    }
    .await
    .map_err(reqwest::Error::without_url);
    log_request(
        &Method::GET,
        target.host_str().unwrap_or_default(),
        target.path(),
        started,
        result
            .as_ref()
            .map(|(status, body)| (*status, body.as_ref())),
    );
    let (_, body) = result?;
    Ok(serde_json::from_slice(&body)?)
}

// Only host and path are logged: OAuth sends tokens and secrets as query params.
// Bodies are logged for failures only, since successful OAuth bodies carry tokens.
pub fn log_request<E: Display>(
    method: &Method,
    host: &str,
    path: &str,
    started: Instant,
    outcome: std::result::Result<(StatusCode, &[u8]), &E>,
) {
    let ms = started.elapsed().as_millis();
    match outcome {
        // Reads are frequent background lookups; writes are user actions
        // worth keeping in the log.
        Ok((status, _)) if status.is_success() && method == Method::GET => {
            log::debug!("{method} {host}{path} status={} ms={ms}", status.as_u16())
        }
        Ok((status, _)) if status.is_success() => {
            log::info!("{method} {host}{path} status={} ms={ms}", status.as_u16())
        }
        Ok((status, body)) => log::warn!(
            "{method} {host}{path} status={} ms={ms} body={}",
            status.as_u16(),
            String::from_utf8_lossy(body)
        ),
        Err(e) => log::warn!("{method} {host}{path} failed ms={ms}: {e}"),
    }
}

#[cfg(test)]
mod tests {
    use super::{client, get_json};

    #[test]
    fn failed_requests_never_expose_the_query() {
        let result = tauri::async_runtime::block_on(get_json::<serde_json::Value>(
            &client().unwrap(),
            "http://127.0.0.1:1/oauth2/revoke?token=secret",
        ));
        let error = result.unwrap_err().to_string();
        assert!(!error.contains("secret"), "{error}");
    }
}
