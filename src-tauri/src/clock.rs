use crate::error::Result;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

pub fn since_epoch() -> Duration {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
}

pub fn unix_ms() -> u64 {
    since_epoch().as_millis() as u64
}

pub fn rfc3339_after(start: &str, seconds: i64) -> Result<String> {
    let start = OffsetDateTime::parse(start, &Rfc3339)?;
    Ok((start + time::Duration::seconds(seconds)).format(&Rfc3339)?)
}

#[cfg(test)]
mod tests {
    use super::rfc3339_after;

    #[test]
    fn adds_seconds_to_a_twitch_timestamp() {
        assert_eq!(
            rfc3339_after("2021-03-19T06:08:33.871278372Z", 1800).unwrap(),
            "2021-03-19T06:38:33.871278372Z"
        );
        assert!(rfc3339_after("yesterday", 1).is_err());
    }
}
