//! The log's line format and the pure choices made over it: which lines a
//! page returns and which hour files a prune removes.
//!
//! A line is `{timestamp}\t{id}\t{entry json}`, so pages are chosen without
//! parsing the entries.

use std::collections::HashMap;

pub const HOUR_MS: u64 = 3_600_000;

pub fn hour_of(timestamp: u64) -> u64 {
    timestamp / HOUR_MS
}

pub fn format(timestamp: u64, id: &str, entry: &str) -> String {
    format!("{timestamp}\t{id}\t{entry}\n")
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Line<'a> {
    pub timestamp: u64,
    pub id: &'a str,
    pub entry: &'a str,
}

/// Lines in file order; a torn or foreign line is skipped.
pub fn parse(text: &str) -> Vec<Line<'_>> {
    text.lines()
        .filter_map(|line| {
            let mut parts = line.splitn(3, '\t');
            let timestamp = parts.next()?.parse().ok()?;
            let id = parts.next()?;
            let entry = parts.next()?;
            Some(Line {
                timestamp,
                id,
                entry,
            })
        })
        .collect()
}

/// One line per id, the last written: an entry logged again carries its
/// latest state. Sorted by time.
pub fn latest<'a>(lines: impl IntoIterator<Item = Line<'a>>) -> Vec<Line<'a>> {
    let mut by_id: HashMap<&str, Line<'a>> = HashMap::new();
    for line in lines {
        by_id.insert(line.id, line);
    }
    let mut out: Vec<Line<'a>> = by_id.into_values().collect();
    out.sort_by_key(|l| l.timestamp);
    out
}

/// The newest `limit` lines older than `timestamp`.
pub fn before<'a>(lines: Vec<Line<'a>>, timestamp: u64, limit: usize) -> Vec<Line<'a>> {
    let older: Vec<Line<'a>> = latest(lines)
        .into_iter()
        .filter(|l| l.timestamp < timestamp)
        .collect();
    older[older.len().saturating_sub(limit)..].to_vec()
}

/// The oldest `limit` lines newer than `timestamp`.
pub fn after<'a>(lines: Vec<Line<'a>>, timestamp: u64, limit: usize) -> Vec<Line<'a>> {
    latest(lines)
        .into_iter()
        .filter(|l| l.timestamp > timestamp)
        .take(limit)
        .collect()
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HourFile {
    /// The channel's folder, relative to the log's root.
    pub channel: String,
    pub hour: u64,
    pub bytes: u64,
}

/// Files past `max_age_ms`, then the oldest of the rest until the total fits
/// in `max_bytes`.
pub fn to_prune(
    mut files: Vec<HourFile>,
    now_ms: u64,
    max_age_ms: u64,
    max_bytes: u64,
) -> Vec<HourFile> {
    files.sort_by_key(|f| f.hour);
    let cutoff = hour_of(now_ms.saturating_sub(max_age_ms));
    let (expired, kept): (Vec<HourFile>, Vec<HourFile>) =
        files.into_iter().partition(|f| f.hour < cutoff);
    let mut total: u64 = kept.iter().map(|f| f.bytes).sum();
    let mut pruned = expired;
    for file in kept {
        if total <= max_bytes {
            break;
        }
        total -= file.bytes;
        pruned.push(file);
    }
    pruned
}

#[cfg(test)]
mod tests {
    use super::*;

    fn line(timestamp: u64, id: &str) -> Line<'_> {
        Line {
            timestamp,
            id,
            entry: "{}",
        }
    }

    #[test]
    fn parses_what_it_formats_and_skips_torn_lines() {
        let text = format!(
            "{}12\tbroken\n{}",
            format(5, "a", "{\"x\":1}"),
            format(7, "b", "{}")
        );
        let lines = parse(&text);
        assert_eq!(
            lines,
            vec![
                Line {
                    timestamp: 5,
                    id: "a",
                    entry: "{\"x\":1}"
                },
                line(7, "b")
            ]
        );
    }

    #[test]
    fn the_last_write_of_an_id_wins() {
        let lines = vec![
            Line {
                timestamp: 1,
                id: "a",
                entry: "old",
            },
            line(2, "b"),
            Line {
                timestamp: 1,
                id: "a",
                entry: "new",
            },
        ];
        let out = latest(lines);
        assert_eq!(out.len(), 2);
        assert_eq!(out[0].entry, "new");
    }

    #[test]
    fn pages_take_the_nearest_lines_on_their_side() {
        let lines = || {
            (1..=6)
                .map(|t| line(t, ["a", "b", "c", "d", "e", "f"][t as usize - 1]))
                .collect()
        };
        let ids = |ls: Vec<Line>| ls.iter().map(|l| l.id.to_string()).collect::<Vec<_>>();
        assert_eq!(ids(before(lines(), 5, 2)), ["c", "d"]);
        assert_eq!(ids(after(lines(), 2, 2)), ["c", "d"]);
        assert_eq!(ids(before(lines(), 1, 2)), Vec::<String>::new());
    }

    #[test]
    fn prunes_expired_hours_then_oldest_until_under_the_cap() {
        let file = |channel: &str, hour: u64, bytes: u64| HourFile {
            channel: channel.into(),
            hour,
            bytes,
        };
        let now = 100 * HOUR_MS;
        let files = vec![
            file("a", 10, 1),
            file("b", 98, 50),
            file("a", 97, 50),
            file("b", 99, 50),
        ];
        let pruned = to_prune(files, now, 50 * HOUR_MS, 100);
        assert_eq!(pruned, vec![file("a", 10, 1), file("a", 97, 50)]);
    }
}
