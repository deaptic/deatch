pub mod commands;

use crate::platform::clock::unix_ms;
use crate::platform::db::{Databases, Schema};
use crate::platform::error::Result;
use crate::twitch::client::ids::UserId;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Deserialize;
use std::time::Duration;
use tauri::Manager;

const MAX_AGE_MS: u64 = 7 * 24 * 60 * 60 * 1000;
const MAX_BYTES: u64 = 1 << 30;
const PRUNE_EVERY: Duration = Duration::from_secs(60 * 60);

pub const SCHEMA: Schema = Schema {
    feature: "feedlog",
    steps: &[
        "CREATE TABLE feed_entries (
            channel TEXT NOT NULL,
            id TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            entry TEXT NOT NULL,
            UNIQUE (channel, id)
        );
        CREATE INDEX feed_entries_by_channel_time ON feed_entries (channel, timestamp);
        CREATE INDEX feed_entries_by_time ON feed_entries (timestamp);",
        DROP_CONNECTION_NOTICES,
    ],
};

const DROP_CONNECTION_NOTICES: &str = "DELETE FROM feed_entries
    WHERE json_valid(entry)
      AND json_extract(entry, '$.kind') = 'event'
      AND json_extract(entry, '$.notice_type')
          IN ('chat_connected', 'chat_disconnected', 'chat_connect_failed');";

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub id: String,
    pub timestamp: u64,
    pub entry: String,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AppendParams {
    pub broadcaster_id: UserId,
    pub entries: Vec<LogEntry>,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum Side {
    Before,
    After,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Cursor {
    pub side: Side,
    pub id: String,
    pub timestamp: u64,
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
    let Cursor {
        side,
        id,
        timestamp,
    } = params.cursor;
    let at = position(db, channel, &id)?.unwrap_or(Position {
        timestamp,
        rowid: i64::MAX,
    });
    match side {
        Side::Before => before(db, channel, at, params.limit),
        Side::After => after(db, channel, at, params.limit),
    }
}

pub fn around(db: &Connection, params: AroundParams) -> Result<Option<Vec<String>>> {
    let channel = params.broadcaster_id.as_str();
    let Some(at) = position(db, channel, &params.id)? else {
        return Ok(None);
    };
    let half = params.limit / 2;
    let through = Position {
        rowid: at.rowid + 1,
        ..at
    };
    let mut out = before(db, channel, through, half + 1)?;
    out.extend(after(db, channel, at, half)?);
    Ok(Some(out))
}

#[derive(Clone, Copy)]
struct Position {
    timestamp: u64,
    rowid: i64,
}

fn position(db: &Connection, channel: &str, id: &str) -> Result<Option<Position>> {
    Ok(db
        .query_row(
            "SELECT timestamp, rowid FROM feed_entries WHERE channel = ?1 AND id = ?2",
            params![channel, id],
            |row| {
                Ok(Position {
                    timestamp: row.get(0)?,
                    rowid: row.get(1)?,
                })
            },
        )
        .optional()?)
}

fn before(db: &Connection, channel: &str, at: Position, limit: usize) -> Result<Vec<String>> {
    let mut query = db.prepare_cached(
        "SELECT entry FROM (
            SELECT entry, timestamp, rowid FROM feed_entries
            WHERE channel = ?1 AND (timestamp, rowid) < (?2, ?3)
            ORDER BY timestamp DESC, rowid DESC LIMIT ?4
        ) ORDER BY timestamp, rowid",
    )?;
    let rows = query.query_map(params![channel, at.timestamp, at.rowid, limit], |row| {
        row.get(0)
    })?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

fn after(db: &Connection, channel: &str, at: Position, limit: usize) -> Result<Vec<String>> {
    let mut query = db.prepare_cached(
        "SELECT entry FROM feed_entries
         WHERE channel = ?1 AND (timestamp, rowid) > (?2, ?3)
         ORDER BY timestamp, rowid LIMIT ?4",
    )?;
    let rows = query.query_map(params![channel, at.timestamp, at.rowid, limit], |row| {
        row.get(0)
    })?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

pub fn clear(db: &Connection) -> Result<()> {
    db.execute("DELETE FROM feed_entries", [])?;
    db.execute_batch("PRAGMA incremental_vacuum")?;
    Ok(())
}

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

fn used_bytes(db: &Connection) -> Result<u64> {
    let pragma =
        |name: &str| -> Result<u64> { Ok(db.pragma_query_value(None, name, |row| row.get(0))?) };
    Ok((pragma("page_count")? - pragma("freelist_count")?) * pragma("page_size")?)
}

pub fn spawn_pruning(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            let pruned = crate::platform::blocking::run(app.clone(), |app| {
                let dbs = app.state::<Databases>();
                for account in dbs.accounts()? {
                    dbs.upkeep(&account, |db| prune(db, unix_ms(), MAX_BYTES))?;
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
    use crate::platform::db::in_memory;

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

    #[test]
    fn connection_notices_are_dropped_from_old_logs() {
        let notice = |id: &str, kind: &str| {
            entry(
                id,
                1,
                &format!(r#"{{"kind":"event","notice_type":"{kind}"}}"#),
            )
        };
        let db = log(vec![
            notice("a", "chat_connected"),
            notice("b", "chat_disconnected"),
            notice("c", "chat_connect_failed"),
            notice("d", "follow"),
            entry(
                "e",
                1,
                r#"{"kind":"message","notice_type":"chat_connected"}"#,
            ),
            entry("f", 1, "not json"),
        ]);
        db.execute_batch(DROP_CONNECTION_NOTICES).unwrap();
        let mut kept = db
            .prepare("SELECT id FROM feed_entries ORDER BY id")
            .unwrap()
            .query_map([], |row| row.get::<_, String>(0))
            .unwrap()
            .collect::<std::result::Result<Vec<_>, _>>()
            .unwrap();
        kept.sort();
        assert_eq!(kept, ["d", "e", "f"]);
    }

    fn page_of(db: &Connection, side: Side, id: &str, timestamp: u64, limit: usize) -> Vec<String> {
        let cursor = Cursor {
            side,
            id: id.into(),
            timestamp,
        };
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

    fn around_of(db: &Connection, id: &str, limit: usize) -> Option<Vec<String>> {
        around(
            db,
            AroundParams {
                broadcaster_id: "c".into(),
                id: id.into(),
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
        assert_eq!(page_of(&db, Side::After, "start", 0, 10), ["new", "b"]);
    }

    #[test]
    fn pages_take_the_nearest_entries_on_their_side() {
        let db = log((1..=6)
            .map(|t| entry(&t.to_string(), t, &t.to_string()))
            .collect());
        assert_eq!(page_of(&db, Side::Before, "5", 5, 2), ["3", "4"]);
        assert_eq!(page_of(&db, Side::After, "2", 2, 2), ["3", "4"]);
        assert!(page_of(&db, Side::Before, "1", 1, 2).is_empty());
    }

    fn one_moment() -> Connection {
        log(vec![
            entry("a", 1, "a"),
            entry("b", 2, "b"),
            entry("c", 2, "c"),
            entry("d", 2, "d"),
            entry("e", 2, "e"),
            entry("f", 3, "f"),
        ])
    }

    #[test]
    fn entries_of_one_moment_page_in_logged_order_without_gaps() {
        let db = one_moment();
        assert_eq!(page_of(&db, Side::Before, "d", 2, 2), ["b", "c"]);
        assert_eq!(page_of(&db, Side::After, "b", 2, 2), ["c", "d"]);
        let mut back = vec!["f".to_string()];
        while let Some(first) = back.first().cloned() {
            let older = page_of(&db, Side::Before, &first, 0, 1);
            if older.is_empty() {
                break;
            }
            back.splice(0..0, older);
        }
        assert_eq!(back, ["a", "b", "c", "d", "e", "f"]);
    }

    #[test]
    fn an_entry_the_log_lacks_is_placed_last_at_its_moment() {
        let db = one_moment();
        assert_eq!(page_of(&db, Side::Before, "x", 2, 2), ["d", "e"]);
        assert_eq!(page_of(&db, Side::After, "x", 2, 2), ["f"]);
    }

    #[test]
    fn around_finds_an_entry_by_id_alone() {
        let db = log((1..=9)
            .map(|t| entry(&t.to_string(), t, &t.to_string()))
            .collect());
        assert_eq!(around_of(&db, "5", 4).unwrap(), ["3", "4", "5", "6", "7"]);
        assert!(around_of(&db, "x", 4).is_none());
    }

    #[test]
    fn around_keeps_the_entry_among_others_of_its_moment() {
        let db = log(('a'..='i')
            .map(|c| entry(&c.to_string(), 1, &c.to_string()))
            .collect());
        assert_eq!(around_of(&db, "e", 4).unwrap(), ["c", "d", "e", "f", "g"]);
    }

    #[test]
    fn clearing_lets_every_entry_go() {
        let db = one_moment();
        clear(&db).unwrap();
        assert!(page_of(&db, Side::After, "start", 0, 10).is_empty());
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
        let left = page_of(&db, Side::After, "start", 0, 100);
        assert!(!left.contains(&"e".to_string()));
        assert!(!left.is_empty() && left.len() < 50);
        assert!(used_bytes(&db).unwrap() <= 64 * 1024);
    }
}
