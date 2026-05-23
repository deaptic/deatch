use serde::Serialize;

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
