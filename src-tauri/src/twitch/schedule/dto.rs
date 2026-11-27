use crate::twitch::client::ids::UserId;
use serde::Serialize;
use twitch_api::helix::schedule::Segment;

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledStream {
    pub broadcaster_id: UserId,
    pub title: String,
    pub start: String,
    pub category: Option<String>,
}

pub fn scheduled(broadcaster_id: &UserId, segment: Segment) -> Option<ScheduledStream> {
    if segment.canceled_until.is_some() {
        return None;
    }
    Some(ScheduledStream {
        broadcaster_id: broadcaster_id.clone(),
        title: segment.title,
        start: segment.start_time.as_str().to_owned(),
        category: segment.category.map(|c| c.name),
    })
}
