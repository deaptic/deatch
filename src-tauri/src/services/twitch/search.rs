use super::helix;
use crate::dto::twitch::search::{Category, SearchChannel};
use twitch_api::helix::search::search_categories::SearchCategoriesRequest;
use twitch_api::helix::search::search_channels::SearchChannelsRequest;
use twitch_api::twitch_oauth2::UserToken;

pub async fn search_channels(
    token: &UserToken,
    query: String,
    live_only: bool,
    first: Option<usize>,
) -> Result<Vec<SearchChannel>, String> {
    let mut request = SearchChannelsRequest::query(query).live_only(live_only);
    request.first = first;

    helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data.into_iter().map(SearchChannel::from).collect())
}

pub async fn search_categories(
    token: &UserToken,
    query: String,
    first: Option<usize>,
) -> Result<Vec<Category>, String> {
    let mut request = SearchCategoriesRequest::query(query);
    request.first = first;

    helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data.into_iter().map(Category::from).collect())
}
