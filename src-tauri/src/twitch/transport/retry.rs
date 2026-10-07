use http::{Method, StatusCode};
use std::time::Duration;

const MAX_RETRIES: u32 = 3;
const BASE_BACKOFF: Duration = Duration::from_millis(500);

/// On a 429 the rate-limit gate already holds the next attempt until the
/// bucket resets, so the backoff here only spaces out retries.
pub fn retry_delay(method: &Method, status: StatusCode, attempt: u32) -> Option<Duration> {
    if attempt >= MAX_RETRIES {
        return None;
    }
    // A 5xx may have been applied before failing; replaying a POST could send
    // a chat message or ban twice.
    let retryable = status == StatusCode::TOO_MANY_REQUESTS
        || (status.is_server_error() && is_idempotent(method));
    retryable.then(|| BASE_BACKOFF * 2u32.pow(attempt))
}

fn is_idempotent(method: &Method) -> bool {
    matches!(
        *method,
        Method::GET | Method::PUT | Method::PATCH | Method::DELETE
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn retries_rate_limits_on_any_method() {
        for method in [Method::GET, Method::POST] {
            assert_eq!(
                retry_delay(&method, StatusCode::TOO_MANY_REQUESTS, 0),
                Some(BASE_BACKOFF)
            );
        }
    }

    #[test]
    fn backs_off_exponentially_on_server_errors_for_idempotent_methods() {
        let status = StatusCode::SERVICE_UNAVAILABLE;
        let delays: Vec<_> = (0..3)
            .map(|attempt| retry_delay(&Method::GET, status, attempt))
            .collect();
        assert_eq!(
            delays,
            [
                Some(Duration::from_millis(500)),
                Some(Duration::from_millis(1000)),
                Some(Duration::from_millis(2000)),
            ]
        );
    }

    #[test]
    fn never_replays_post_after_server_error() {
        assert_eq!(
            retry_delay(&Method::POST, StatusCode::INTERNAL_SERVER_ERROR, 0),
            None
        );
    }

    #[test]
    fn gives_up_after_max_retries() {
        let status = StatusCode::TOO_MANY_REQUESTS;
        assert_eq!(retry_delay(&Method::GET, status, MAX_RETRIES), None);
    }

    #[test]
    fn does_not_retry_client_errors_or_success() {
        for status in [
            StatusCode::OK,
            StatusCode::BAD_REQUEST,
            StatusCode::UNAUTHORIZED,
        ] {
            assert_eq!(retry_delay(&Method::GET, status, 0), None);
        }
    }
}
