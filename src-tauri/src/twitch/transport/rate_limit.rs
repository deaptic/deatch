use http::HeaderMap;
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

pub struct RateLimit {
    resets_at: Mutex<Option<u64>>,
}

impl RateLimit {
    pub fn new() -> Self {
        Self {
            resets_at: Mutex::new(None),
        }
    }

    pub async fn wait(&self) {
        let resets_at = *self.resets_at.lock().unwrap();
        if let Some(wait) = resets_at.and_then(|at| until(at, now())) {
            tokio::time::sleep(wait).await;
        }
    }

    pub fn observe(&self, headers: &HeaderMap) {
        let Some(bucket) = Bucket::from_headers(headers) else {
            return;
        };
        *self.resets_at.lock().unwrap() = bucket.is_exhausted().then_some(bucket.resets_at);
    }

    pub fn reset_in(headers: &HeaderMap) -> Option<Duration> {
        Bucket::from_headers(headers).and_then(|b| until(b.resets_at, now()))
    }
}

struct Bucket {
    remaining: u32,
    resets_at: u64,
}

impl Bucket {
    fn from_headers(headers: &HeaderMap) -> Option<Self> {
        Some(Self {
            remaining: header_number(headers, "ratelimit-remaining")?,
            resets_at: header_number(headers, "ratelimit-reset")?,
        })
    }

    fn is_exhausted(&self) -> bool {
        self.remaining == 0
    }
}

fn header_number<T: std::str::FromStr>(headers: &HeaderMap, name: &str) -> Option<T> {
    headers.get(name)?.to_str().ok()?.parse().ok()
}

fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
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

    #[test]
    fn reads_bucket_from_headers() {
        let bucket = Bucket::from_headers(&headers("0", "1700000000")).unwrap();
        assert!(bucket.is_exhausted());
        assert_eq!(bucket.resets_at, 1_700_000_000);
        assert!(!Bucket::from_headers(&headers("799", "1700000000"))
            .unwrap()
            .is_exhausted());
    }

    #[test]
    fn ignores_missing_or_malformed_headers() {
        assert!(Bucket::from_headers(&HeaderMap::new()).is_none());
        assert!(Bucket::from_headers(&headers("lots", "1700000000")).is_none());
    }

    #[test]
    fn pauses_only_while_exhausted() {
        let limit = RateLimit::new();
        let future = (now() + 30).to_string();
        limit.observe(&headers("0", &future));
        assert!(limit.resets_at.lock().unwrap().is_some());
        limit.observe(&headers("5", &future));
        assert!(limit.resets_at.lock().unwrap().is_none());
    }

    #[test]
    fn measures_time_until_reset() {
        assert_eq!(until(110, 100), Some(Duration::from_secs(10)));
        assert_eq!(until(100, 100), None);
        assert_eq!(until(90, 100), None);
    }
}
