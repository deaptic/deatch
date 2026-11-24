pub mod commands;
pub mod dto;
mod entities;
mod page;

use crate::platform::error::Result;
use dto::LinkPreview;
use reqwest::Url;
use serde::Deserialize;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LinkPreviewParams {
    pub url: String,
}

pub async fn preview(
    http: &reqwest::Client,
    params: LinkPreviewParams,
) -> Result<Option<LinkPreview>> {
    match Url::parse(&params.url) {
        Ok(url) if matches!(url.scheme(), "https" | "http") => page::fetch(http, url).await,
        _ => Ok(None),
    }
}
