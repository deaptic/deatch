use serde::Serialize;
use twitch_api::helix::videos::get_videos::Video;

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LastStream {
    pub started_at: String,
    pub seconds: u32,
    pub title: String,
}

pub fn seconds_of(duration: &str) -> u32 {
    let mut total = 0;
    let mut number = 0;
    for c in duration.chars() {
        if let Some(digit) = c.to_digit(10) {
            number = number * 10 + digit;
            continue;
        }
        total += number
            * match c {
                'h' => 3600,
                'm' => 60,
                _ => 1,
            };
        number = 0;
    }
    total
}

impl From<Video> for LastStream {
    fn from(v: Video) -> Self {
        Self {
            started_at: v.created_at.to_string(),
            seconds: seconds_of(&v.duration),
            title: v.title,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn twitch_durations_turn_into_seconds() {
        assert_eq!(seconds_of("3h12m10s"), 3 * 3600 + 12 * 60 + 10);
        assert_eq!(seconds_of("45m"), 45 * 60);
        assert_eq!(seconds_of("9s"), 9);
        assert_eq!(seconds_of(""), 0);
    }
}
