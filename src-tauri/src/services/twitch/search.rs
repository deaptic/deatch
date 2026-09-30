use super::Authed;
use crate::dto::twitch::search::{Category, SearchChannel};
use crate::error::Result;
use twitch_api::helix::search::search_categories::SearchCategoriesRequest;
use twitch_api::helix::search::search_channels::SearchChannelsRequest;

pub async fn search_channels(
    twitch: &Authed<'_>,
    query: String,
    live_only: bool,
    first: Option<usize>,
) -> Result<Vec<SearchChannel>> {
    let mut request = SearchChannelsRequest::query(query).live_only(live_only);
    request.first = first;

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(SearchChannel::from).collect())
}

pub async fn search_categories(
    twitch: &Authed<'_>,
    query: String,
    first: Option<usize>,
) -> Result<Vec<Category>> {
    let mut request = SearchCategoriesRequest::query(query);
    request.first = first;

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(Category::from).collect())
}
