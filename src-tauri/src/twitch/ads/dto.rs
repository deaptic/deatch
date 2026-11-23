use serde::{Deserialize, Serialize};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

const MS_PER_SECOND: i64 = 1000;

#[derive(Debug, PartialEq, Deserialize)]
#[serde(untagged)]
enum TwitchTime {
    Seconds(i64),
    Text(String),
}

impl TwitchTime {
    fn unix_ms(&self) -> Option<i64> {
        match self {
            Self::Seconds(0) => None,
            Self::Seconds(s) => Some(s * MS_PER_SECOND),
            Self::Text(t) => OffsetDateTime::parse(t, &Rfc3339)
                .ok()
                .map(|at| (at.unix_timestamp_nanos() / 1_000_000) as i64),
        }
    }
}

#[derive(Debug, PartialEq, Deserialize)]
pub struct HelixAdSchedule {
    snooze_count: u32,
    snooze_refresh_at: TwitchTime,
    next_ad_at: TwitchTime,
    duration: u32,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AdSchedule {
    pub next_ad_ms: Option<i64>,
    pub duration_seconds: u32,
    pub snooze_count: u32,
    pub snooze_refresh_ms: Option<i64>,
}

impl From<HelixAdSchedule> for AdSchedule {
    fn from(s: HelixAdSchedule) -> Self {
        Self {
            next_ad_ms: s.next_ad_at.unix_ms(),
            duration_seconds: s.duration,
            snooze_count: s.snooze_count,
            snooze_refresh_ms: s.snooze_refresh_at.unix_ms(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{AdSchedule, HelixAdSchedule};
    use serde_json::json;

    fn schedule(value: serde_json::Value) -> AdSchedule {
        AdSchedule::from(serde_json::from_value::<HelixAdSchedule>(value).unwrap())
    }

    #[test]
    fn reads_times_sent_as_unix_seconds() {
        let s = schedule(json!({
            "next_ad_at": 1_700_000_000,
            "last_ad_at": 1_699_990_000,
            "duration": 60,
            "preroll_free_time": 0,
            "snooze_count": 2,
            "snooze_refresh_at": 1_700_003_600,
        }));
        assert_eq!(s.next_ad_ms, Some(1_700_000_000_000));
        assert_eq!(s.snooze_refresh_ms, Some(1_700_003_600_000));
        assert_eq!((s.duration_seconds, s.snooze_count), (60, 2));
    }

    #[test]
    fn reads_times_sent_as_rfc3339_and_empty_as_none() {
        let s = schedule(json!({
            "next_ad_at": "",
            "last_ad_at": "",
            "duration": 0,
            "preroll_free_time": 0,
            "snooze_count": 3,
            "snooze_refresh_at": "2023-08-01T23:08:18+00:00",
        }));
        assert_eq!(s.next_ad_ms, None);
        assert_eq!(s.snooze_refresh_ms, Some(1_690_931_298_000));
    }

    #[test]
    fn zero_means_no_ad_scheduled() {
        let s = schedule(json!({
            "next_ad_at": 0,
            "duration": 0,
            "snooze_count": 0,
            "snooze_refresh_at": 0,
        }));
        assert_eq!((s.next_ad_ms, s.snooze_refresh_ms), (None, None));
    }
}
