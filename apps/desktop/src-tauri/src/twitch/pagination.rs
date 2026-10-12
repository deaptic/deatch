use crate::error::Result;
use futures_util::{Stream, TryStreamExt};
use serde::Serialize;
use twitch_api::helix::ClientRequestError;

#[derive(Serialize, specta::Type)]
pub struct Pagination {
    pub cursor: Option<String>,
}

#[derive(Serialize, specta::Type)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub pagination: Pagination,
}

impl<T> PaginatedResponse<T> {
    pub fn new(data: Vec<T>, cursor: Option<String>) -> Self {
        Self {
            data,
            pagination: Pagination { cursor },
        }
    }
}

pub async fn collect<U, T>(
    stream: impl Stream<Item = std::result::Result<U, ClientRequestError<reqwest::Error>>>,
) -> Result<Vec<T>>
where
    T: From<U>,
{
    Ok(stream.map_ok(T::from).try_collect().await?)
}
