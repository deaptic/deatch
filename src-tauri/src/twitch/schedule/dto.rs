use crate::twitch::client::ids::UserId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledStream {
    pub broadcaster_id: UserId,
    pub title: String,
    pub start: String,
    pub category: Option<String>,
}

#[derive(Debug, PartialEq, Deserialize)]
pub struct HelixSchedule {
    #[serde(default)]
    pub segments: Option<Vec<HelixSegment>>,
}

#[derive(Debug, PartialEq, Deserialize)]
pub struct HelixSegment {
    title: String,
    start_time: String,
    canceled_until: Option<String>,
    category: Option<HelixCategory>,
}

#[derive(Debug, PartialEq, Deserialize)]
struct HelixCategory {
    name: String,
}

pub fn scheduled(broadcaster_id: &UserId, segment: HelixSegment) -> Option<ScheduledStream> {
    if segment.canceled_until.is_some() {
        return None;
    }
    Some(ScheduledStream {
        broadcaster_id: broadcaster_id.clone(),
        title: segment.title,
        start: segment.start_time,
        category: segment.category.map(|c| c.name),
    })
}

#[cfg(test)]
mod tests {
    use super::{scheduled, HelixSchedule};
    use crate::twitch::client::ids::UserId;

    #[test]
    fn streams_without_an_end_time_are_kept_and_canceled_ones_dropped() {
        let schedule: HelixSchedule = serde_json::from_str(
            r#"{"segments":[
                {"id":"a","start_time":"2026-11-28T15:00:00Z","end_time":null,"title":"STRIIMI","canceled_until":null,"category":null,"is_recurring":true},
                {"id":"b","start_time":"2026-12-01T15:00:00Z","end_time":"2026-12-01T17:00:00Z","title":"Off","canceled_until":"2026-12-01T17:00:00Z","category":{"id":"1","name":"Chatting"},"is_recurring":true}
            ],"broadcaster_id":"1","vacation":null}"#,
        )
        .unwrap();
        let id: UserId = "1".into();
        let streams: Vec<_> = schedule
            .segments
            .unwrap_or_default()
            .into_iter()
            .filter_map(|segment| scheduled(&id, segment))
            .collect();
        assert_eq!(streams.len(), 1);
        assert_eq!(streams[0].title, "STRIIMI");
        assert_eq!(streams[0].start, "2026-11-28T15:00:00Z");
    }

    #[test]
    fn a_schedule_with_no_segments_reads_as_empty() {
        let schedule: HelixSchedule =
            serde_json::from_str(r#"{"segments":null,"broadcaster_id":"1"}"#).unwrap();
        assert_eq!(schedule.segments, None);
    }
}
