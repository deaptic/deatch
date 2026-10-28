use super::dto::{EmoteEntry, FfzResponse};
use crate::error::Result;
use crate::http::get_json;

pub async fn get_global_emotes(http: &reqwest::Client) -> Result<Vec<EmoteEntry>> {
    let response: FfzResponse =
        get_json(http, "https://api.frankerfacez.com/v1/set/global").await?;
    Ok(response.into())
}

pub async fn get_channel_emotes(
    http: &reqwest::Client,
    broadcaster_login: String,
) -> Result<Vec<EmoteEntry>> {
    let response: FfzResponse = get_json(
        http,
        &format!("https://api.frankerfacez.com/v1/room/{broadcaster_login}"),
    )
    .await?;
    Ok(response.into())
}
