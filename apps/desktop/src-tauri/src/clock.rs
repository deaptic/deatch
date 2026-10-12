use std::time::{Duration, SystemTime, UNIX_EPOCH};

pub fn since_epoch() -> Duration {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
}

pub fn unix_ms() -> u64 {
    since_epoch().as_millis() as u64
}
