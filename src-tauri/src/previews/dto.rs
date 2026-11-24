use serde::Serialize;

#[derive(Debug, PartialEq, Serialize, specta::Type)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum LinkPreview {
    Card {
        site: String,
        title: String,
        description: Option<String>,
        thumbnail: Option<String>,
        video: bool,
    },
    Image {
        site: String,
        url: String,
    },
}
