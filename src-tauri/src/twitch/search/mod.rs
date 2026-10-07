pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::Result;
use dto::{Category, SearchChannel};
use serde::Deserialize;
use twitch_api::helix::search::search_categories::SearchCategoriesRequest;
use twitch_api::helix::search::search_channels::SearchChannelsRequest;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SearchParams {
    pub query: String,
    pub first: usize,
}

pub async fn search_channels(
    twitch: &Authed<'_>,
    params: SearchParams,
) -> Result<Vec<SearchChannel>> {
    if params.query.trim().is_empty() {
        return Ok(Vec::new());
    }
    let mut request = SearchChannelsRequest::query(params.query);
    request.first = Some(params.first);
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(SearchChannel::from).collect())
}

pub async fn search_categories(twitch: &Authed<'_>, params: SearchParams) -> Result<Vec<Category>> {
    if params.query.trim().is_empty() {
        return Ok(Vec::new());
    }
    let mut request = SearchCategoriesRequest::query(params.query);
    request.first = Some(params.first);
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(Category::from).collect())
}
