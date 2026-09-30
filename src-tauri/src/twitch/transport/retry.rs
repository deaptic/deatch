use http::{Method, StatusCode};
use std::time::Duration;

const MAX_RETRIES: u32 = 3;
const BASE_BACKOFF: Duration = Duration::from_millis(500);
const MAX_RATE_LIMIT_WAIT: Duration = Duration::from_secs(10);

pub fn retry_delay(
    method: &Method,
    status: StatusCode,
    reset_in: Option<Duration>,
    attempt: u32,
) -> Option<Duration> {
    if attempt >= MAX_RETRIES {
        return None;
    }
    if status == StatusCode::TOO_MANY_REQUESTS {
        return Some(
            reset_in
                .unwrap_or_else(|| backoff(attempt))
                .clamp(BASE_BACKOFF, MAX_RATE_LIMIT_WAIT),
        );
    }
    // A 5xx may have been applied before failing; replaying a POST could send
    // a chat message or ban twice.
    if status.is_server_error() && is_idempotent(method) {
        return Some(backoff(attempt));
    }
    None
}

fn is_idempotent(method: &Method) -> bool {
    matches!(
        *method,
        Method::GET | Method::PUT | Method::PATCH | Method::DELETE
    )
}

fn backoff(attempt: u32) -> Duration {
    BASE_BACKOFF * 2u32.pow(attempt)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn waits_for_rate_limit_reset_on_any_method() {
        let reset = Some(Duration::from_secs(3));
        for method in [Method::GET, Method::POST] {
            assert_eq!(
                retry_delay(&method, StatusCode::TOO_MANY_REQUESTS, reset, 0),
                Some(Duration::from_secs(3))
            );
        }
    }

    #[test]
    fn clamps_rate_limit_wait() {
        let far = Some(Duration::from_secs(60));
        let past = Some(Duration::ZERO);
        let status = StatusCode::TOO_MANY_REQUESTS;
        assert_eq!(
            retry_delay(&Method::GET, status, far, 0),
            Some(MAX_RATE_LIMIT_WAIT)
        );
        assert_eq!(
            retry_delay(&Method::GET, status, past, 0),
            Some(BASE_BACKOFF)
        );
    }

    #[test]
    fn backs_off_exponentially_on_server_errors_for_idempotent_methods() {
        let status = StatusCode::SERVICE_UNAVAILABLE;
        let delays: Vec<_> = (0..3)
            .map(|attempt| retry_delay(&Method::GET, status, None, attempt))
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
            retry_delay(&Method::POST, StatusCode::INTERNAL_SERVER_ERROR, None, 0),
            None
        );
    }

    #[test]
    fn gives_up_after_max_retries() {
        let status = StatusCode::TOO_MANY_REQUESTS;
        assert_eq!(retry_delay(&Method::GET, status, None, MAX_RETRIES), None);
    }

    #[test]
    fn does_not_retry_client_errors_or_success() {
        for status in [
            StatusCode::OK,
            StatusCode::BAD_REQUEST,
            StatusCode::UNAUTHORIZED,
        ] {
            assert_eq!(retry_delay(&Method::GET, status, None, 0), None);
        }
    }
}
