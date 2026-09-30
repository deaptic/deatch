use crate::error::Result;
use serde::de::DeserializeOwned;
use std::time::Duration;

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
    Ok(http.get(url).send().await?.json().await?)
}
