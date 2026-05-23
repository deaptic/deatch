use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct EmoteEntry {
    pub name: String,
    pub url: String,
}
