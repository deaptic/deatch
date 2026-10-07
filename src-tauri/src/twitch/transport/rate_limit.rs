use http::HeaderMap;
use std::sync::Mutex;
use std::time::Duration;

#[derive(Default)]
pub struct RateLimit {
    resets_at: Mutex<Option<u64>>,
}

impl RateLimit {
    pub async fn wait(&self) {
        if let Some(wait) = self.paused_for() {
            tokio::time::sleep(wait).await;
        }
    }

    pub fn paused_for(&self) -> Option<Duration> {
        let resets_at = *self.resets_at.lock().unwrap();
        resets_at.and_then(|at| until(at, now()))
    }

    pub fn observe(&self, headers: &HeaderMap) {
        let remaining = header_number::<u32>(headers, "ratelimit-remaining");
        let resets_at = header_number::<u64>(headers, "ratelimit-reset");
        if let (Some(remaining), Some(resets_at)) = (remaining, resets_at) {
            *self.resets_at.lock().unwrap() = (remaining == 0).then_some(resets_at);
        }
    }
}

fn header_number<T: std::str::FromStr>(headers: &HeaderMap, name: &str) -> Option<T> {
    headers.get(name)?.to_str().ok()?.parse().ok()
}

fn now() -> u64 {
    crate::clock::since_epoch().as_secs()
}

fn until(at: u64, now: u64) -> Option<Duration> {
    (at > now).then(|| Duration::from_secs(at - now))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn headers(remaining: &str, reset: &str) -> HeaderMap {
        let mut h = HeaderMap::new();
        h.insert("Ratelimit-Remaining", remaining.parse().unwrap());
        h.insert("Ratelimit-Reset", reset.parse().unwrap());
        h
    }

    fn resets_at(limit: &RateLimit) -> Option<u64> {
        *limit.resets_at.lock().unwrap()
    }

    #[test]
    fn pauses_only_while_exhausted() {
        let limit = RateLimit::default();
        limit.observe(&headers("0", "1700000000"));
        assert_eq!(resets_at(&limit), Some(1_700_000_000));
        limit.observe(&headers("799", "1700000000"));
        assert_eq!(resets_at(&limit), None);
    }

    #[test]
    fn ignores_missing_or_malformed_headers() {
        let limit = RateLimit::default();
        limit.observe(&headers("0", "1700000000"));
        limit.observe(&HeaderMap::new());
        limit.observe(&headers("lots", "1700000000"));
        assert_eq!(resets_at(&limit), Some(1_700_000_000));
    }

    #[test]
    fn measures_time_until_reset() {
        assert_eq!(until(110, 100), Some(Duration::from_secs(10)));
        assert_eq!(until(100, 100), None);
        assert_eq!(until(90, 100), None);
    }
}
