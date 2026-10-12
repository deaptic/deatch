use http::HeaderMap;
use std::sync::Mutex;
use std::time::Duration;

/// Only Helix responses describe the general request bucket; OAuth calls
/// share the transport but answer for a different service.
const HELIX_HOST: &str = "api.twitch.tv";

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

    pub fn observe(&self, host: Option<&str>, headers: &HeaderMap) {
        if host != Some(HELIX_HOST) {
            return;
        }
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

    const HELIX: Option<&str> = Some(HELIX_HOST);

    fn headers(remaining: &str, reset: &str) -> HeaderMap {
        let mut h = HeaderMap::new();
        h.insert("Ratelimit-Remaining", remaining.parse().unwrap());
        h.insert("Ratelimit-Reset", reset.parse().unwrap());
        h
    }

    fn future() -> String {
        (now() + 30).to_string()
    }

    #[test]
    fn pauses_only_while_exhausted() {
        let limit = RateLimit::default();
        limit.observe(HELIX, &headers("0", &future()));
        assert!(limit.paused_for().is_some());
        limit.observe(HELIX, &headers("799", &future()));
        assert!(limit.paused_for().is_none());
    }

    #[test]
    fn ignores_other_twitch_hosts() {
        let limit = RateLimit::default();
        limit.observe(Some("id.twitch.tv"), &headers("0", &future()));
        assert!(limit.paused_for().is_none());
    }

    #[test]
    fn ignores_missing_or_malformed_headers() {
        let limit = RateLimit::default();
        limit.observe(HELIX, &headers("0", &future()));
        limit.observe(HELIX, &HeaderMap::new());
        limit.observe(HELIX, &headers("lots", &future()));
        assert!(limit.paused_for().is_some());
    }

    #[test]
    fn measures_time_until_reset() {
        assert_eq!(until(110, 100), Some(Duration::from_secs(10)));
        assert_eq!(until(100, 100), None);
        assert_eq!(until(90, 100), None);
    }
}
