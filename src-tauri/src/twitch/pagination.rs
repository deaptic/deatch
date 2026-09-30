use crate::error::Result;
use futures_util::{Stream, TryStreamExt};
use serde::Serialize;
use std::borrow::Cow;
use twitch_api::helix::{ClientRequestError, Cursor, CursorRef, Paginated, Response};

#[derive(Serialize)]
pub struct Pagination {
    pub cursor: Option<String>,
}

#[derive(Serialize)]
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

pub fn cursor(after: Option<String>) -> Option<Cow<'static, CursorRef>> {
    after.map(|s| Cow::Owned(Cursor::from(s)))
}

pub fn into_paginated<R, U, T>(
    response: Response<R, Vec<U>>,
    map: impl FnMut(U) -> T,
) -> PaginatedResponse<T>
where
    R: Paginated,
    U: serde::de::DeserializeOwned + PartialEq,
{
    PaginatedResponse::new(
        response.data.into_iter().map(map).collect(),
        response
            .pagination_data
            .cursor
            .map(|c| c.as_str().to_string()),
    )
}
