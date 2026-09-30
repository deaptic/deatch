use super::Authed;
use crate::dto::twitch::search::{Category, SearchChannel};
use crate::error::Result;
use serde::Deserialize;
use twitch_api::helix::search::search_categories::SearchCategoriesRequest;
use twitch_api::helix::search::search_channels::SearchChannelsRequest;

const DEFAULT_CHANNEL_RESULTS: usize = 20;
const DEFAULT_CATEGORY_RESULTS: usize = 10;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct SearchChannelsParams {
    pub query: String,
    pub live_only: bool,
    pub first: Option<usize>,
}

pub async fn search_channels(
    twitch: &Authed<'_>,
    params: SearchChannelsParams,
) -> Result<Vec<SearchChannel>> {
    if params.query.trim().is_empty() {
        return Ok(Vec::new());
    }
    let mut request = SearchChannelsRequest::query(params.query).live_only(params.live_only);
    request.first = Some(params.first.unwrap_or(DEFAULT_CHANNEL_RESULTS));

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(SearchChannel::from).collect())
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct SearchCategoriesParams {
    pub query: String,
    pub first: Option<usize>,
}

pub async fn search_categories(
    twitch: &Authed<'_>,
    params: SearchCategoriesParams,
) -> Result<Vec<Category>> {
    if params.query.trim().is_empty() {
        return Ok(Vec::new());
    }
    let mut request = SearchCategoriesRequest::query(params.query);
    request.first = Some(params.first.unwrap_or(DEFAULT_CATEGORY_RESULTS));

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(Category::from).collect())
}
