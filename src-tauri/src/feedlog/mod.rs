//! Feed history, so the feed can page back past what it holds in memory. One
//! row per entry in the signed-in account's database; entries are the
//! frontend's own JSON, stored and returned untouched, and writing an entry
//! again replaces it with its latest state.

pub mod commands;

use crate::clock::unix_ms;
use crate::db::{Databases, Schema};
use crate::error::Result;
use crate::twitch::ids::UserId;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Deserialize;
use std::time::Duration;
use tauri::Manager;

/// Matches the inbox, so every mention it keeps can still be opened in place.
const MAX_AGE_MS: u64 = 7 * 24 * 60 * 60 * 1000;
/// The account's database is kept under this by letting the oldest entries go.
const MAX_BYTES: u64 = 1 << 30;
const PRUNE_EVERY: Duration = Duration::from_secs(60 * 60);

pub const SCHEMA: Schema = Schema {
    feature: "feedlog",
    steps: &["CREATE TABLE feed_entries (
            channel TEXT NOT NULL,
            id TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            entry TEXT NOT NULL,
            UNIQUE (channel, id)
        );
        CREATE INDEX feed_entries_by_channel_time ON feed_entries (channel, timestamp);
        CREATE INDEX feed_entries_by_time ON feed_entries (timestamp);"],
};

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub id: String,
    pub timestamp: u64,
    /// The entry as JSON, kept as-is.
    pub entry: String,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AppendParams {
    pub broadcaster_id: UserId,
    pub entries: Vec<LogEntry>,
}

/// Which side of a moment a page is read from.
#[derive(Deserialize, specta::Type)]
#[serde(tag = "side", rename_all = "camelCase")]
pub enum Cursor {
    Before { timestamp: u64 },
    After { timestamp: u64 },
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PageParams {
    pub broadcaster_id: UserId,
    pub cursor: Cursor,
    pub limit: usize,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AroundParams {
    pub broadcaster_id: UserId,
    pub id: String,
    pub limit: usize,
}

pub fn append(db: &mut Connection, params: AppendParams) -> Result<()> {
    let tx = db.transaction()?;
    {
        let mut upsert = tx.prepare_cached(
            "INSERT INTO feed_entries (channel, id, timestamp, entry) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT (channel, id) DO UPDATE
             SET timestamp = excluded.timestamp, entry = excluded.entry",
        )?;
        for e in &params.entries {
            upsert.execute(params![
                params.broadcaster_id.as_str(),
                e.id,
                e.timestamp,
                e.entry
            ])?;
        }
    }
    tx.commit()?;
    Ok(())
}

pub fn page(db: &Connection, params: PageParams) -> Result<Vec<String>> {
    let channel = params.broadcaster_id.as_str();
    match params.cursor {
        Cursor::Before { timestamp } => before(db, channel, timestamp, params.limit),
        Cursor::After { timestamp } => after(db, channel, timestamp, params.limit),
    }
}

/// The entries around `id`, oldest first and including it; None when the
/// log no longer has it.
pub fn around(db: &Connection, params: AroundParams) -> Result<Option<Vec<String>>> {
    let channel = params.broadcaster_id.as_str();
    let found: Option<u64> = db
        .query_row(
            "SELECT timestamp FROM feed_entries WHERE channel = ?1 AND id = ?2",
            params![channel, params.id],
            |row| row.get(0),
        )
        .optional()?;
    let Some(timestamp) = found else {
        return Ok(None);
    };
    let half = params.limit / 2;
    let mut out = before(db, channel, timestamp + 1, half + 1)?;
    out.extend(after(db, channel, timestamp, half)?);
    Ok(Some(out))
}

/// The newest `limit` entries older than `timestamp`, oldest first.
fn before(db: &Connection, channel: &str, timestamp: u64, limit: usize) -> Result<Vec<String>> {
    let mut query = db.prepare_cached(
        "SELECT entry FROM (
            SELECT entry, timestamp, rowid FROM feed_entries
            WHERE channel = ?1 AND timestamp < ?2
            ORDER BY timestamp DESC, rowid DESC LIMIT ?3
        ) ORDER BY timestamp, rowid",
    )?;
    let rows = query.query_map(params![channel, timestamp, limit], |row| row.get(0))?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

/// The oldest `limit` entries newer than `timestamp`.
fn after(db: &Connection, channel: &str, timestamp: u64, limit: usize) -> Result<Vec<String>> {
    let mut query = db.prepare_cached(
        "SELECT entry FROM feed_entries
         WHERE channel = ?1 AND timestamp > ?2
         ORDER BY timestamp, rowid LIMIT ?3",
    )?;
    let rows = query.query_map(params![channel, timestamp, limit], |row| row.get(0))?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

/// Lets go of entries past the age limit, then of the oldest tenth at a time
/// while the database is over its size cap, and gives the space back.
pub fn prune(db: &Connection, now_ms: u64, max_bytes: u64) -> Result<()> {
    db.execute(
        "DELETE FROM feed_entries WHERE timestamp < ?1",
        [now_ms.saturating_sub(MAX_AGE_MS)],
    )?;
    while used_bytes(db)? > max_bytes {
        let deleted = db.execute(
            "DELETE FROM feed_entries WHERE rowid IN (
                SELECT rowid FROM feed_entries ORDER BY timestamp
                LIMIT (SELECT count(*) / 10 + 1 FROM feed_entries)
            )",
            [],
        )?;
        if deleted == 0 {
            break;
        }
    }
    db.execute_batch("PRAGMA incremental_vacuum")?;
    Ok(())
}

/// Pages holding data; freed pages wait in the freelist until vacuumed.
fn used_bytes(db: &Connection) -> Result<u64> {
    let pragma =
        |name: &str| -> Result<u64> { Ok(db.pragma_query_value(None, name, |row| row.get(0))?) };
    Ok((pragma("page_count")? - pragma("freelist_count")?) * pragma("page_size")?)
}

/// Prunes every account's log now and then every hour, for as long as the app
/// runs.
pub fn spawn_pruning(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            let pruned = crate::blocking::run(app.clone(), |app| {
                let dbs = app.state::<Databases>();
                for account in dbs.accounts()? {
                    dbs.with(&account, |db| prune(db, unix_ms(), MAX_BYTES))?;
                }
                Ok(())
            })
            .await;
            if let Err(e) = pruned.and_then(|r: Result<()>| r) {
                log::warn!("feed log prune failed: {e}");
            }
            tokio::time::sleep(PRUNE_EVERY).await;
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::in_memory;

    fn entry(id: &str, timestamp: u64, text: &str) -> LogEntry {
        LogEntry {
            id: id.into(),
            timestamp,
            entry: text.into(),
        }
    }

    fn log(entries: Vec<LogEntry>) -> Connection {
        let mut db = in_memory(&[SCHEMA]);
        append(
            &mut db,
            AppendParams {
                broadcaster_id: "c".into(),
                entries,
            },
        )
        .unwrap();
        db
    }

    fn page_of(db: &Connection, cursor: Cursor, limit: usize) -> Vec<String> {
        page(
            db,
            PageParams {
                broadcaster_id: "c".into(),
                cursor,
                limit,
            },
        )
        .unwrap()
    }

    #[test]
    fn writing_an_entry_again_keeps_its_latest_state() {
        let db = log(vec![
            entry("a", 1, "old"),
            entry("b", 2, "b"),
            entry("a", 1, "new"),
        ]);
        assert_eq!(
            page_of(&db, Cursor::After { timestamp: 0 }, 10),
            ["new", "b"]
        );
    }

    #[test]
    fn pages_take_the_nearest_entries_on_their_side() {
        let db = log((1..=6)
            .map(|t| entry(&t.to_string(), t, &t.to_string()))
            .collect());
        assert_eq!(page_of(&db, Cursor::Before { timestamp: 5 }, 2), ["3", "4"]);
        assert_eq!(page_of(&db, Cursor::After { timestamp: 2 }, 2), ["3", "4"]);
        assert!(page_of(&db, Cursor::Before { timestamp: 1 }, 2).is_empty());
    }

    #[test]
    fn around_finds_an_entry_by_id_alone() {
        let db = log((1..=9)
            .map(|t| entry(&t.to_string(), t, &t.to_string()))
            .collect());
        let found = around(
            &db,
            AroundParams {
                broadcaster_id: "c".into(),
                id: "5".into(),
                limit: 4,
            },
        )
        .unwrap();
        assert_eq!(found.unwrap(), ["3", "4", "5", "6", "7"]);
        let missing = around(
            &db,
            AroundParams {
                broadcaster_id: "c".into(),
                id: "x".into(),
                limit: 4,
            },
        )
        .unwrap();
        assert!(missing.is_none());
    }

    #[test]
    fn pruning_drops_expired_entries_then_the_oldest_until_under_the_cap() {
        let now = MAX_AGE_MS + 100;
        let big = "x".repeat(4096);
        let db = log([entry("expired", 1, "e")]
            .into_iter()
            .chain((0..50).map(|i| entry(&format!("k{i}"), 100 + i, &big)))
            .collect());
        prune(&db, now, 64 * 1024).unwrap();
        let left = page_of(&db, Cursor::After { timestamp: 0 }, 100);
        assert!(!left.contains(&"e".to_string()));
        assert!(!left.is_empty() && left.len() < 50);
        assert!(used_bytes(&db).unwrap() <= 64 * 1024);
    }
}
