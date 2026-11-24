pub mod commands;
pub mod dto;

use super::Authed;
use crate::platform::db::Schema;
use crate::platform::error::Result;
use crate::twitch::client::ids::UserId;
use crate::twitch::users::dto::UserRef;
use dto::Whisper;
use rusqlite::{params, Connection, Row};
use serde::Deserialize;

const KEPT: usize = 5000;

pub const SCHEMA: Schema = Schema {
    feature: "whispers",
    steps: &["CREATE TABLE whispers (
            id TEXT PRIMARY KEY,
            peer_id TEXT NOT NULL,
            peer_login TEXT NOT NULL,
            peer_name TEXT NOT NULL,
            outgoing INTEGER NOT NULL,
            text TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            unread INTEGER NOT NULL
        );
        CREATE INDEX whispers_by_time ON whispers (timestamp);"],
};

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SendWhisperParams {
    pub to_user_id: UserId,
    pub message: String,
}

pub async fn send(twitch: &Authed<'_>, params: SendWhisperParams) -> Result<()> {
    twitch
        .helix
        .send_whisper(
            &twitch.token.user_id,
            params.to_user_id.as_str(),
            params.message.as_str(),
            &twitch.token,
        )
        .await?;
    Ok(())
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SaveWhispersParams {
    pub whispers: Vec<Whisper>,
}

pub fn save(db: &mut Connection, params: SaveWhispersParams) -> Result<()> {
    let tx = db.transaction()?;
    {
        let mut upsert = tx.prepare_cached(
            "INSERT INTO whispers
                (id, peer_id, peer_login, peer_name, outgoing, text, timestamp, unread)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT (id) DO UPDATE SET unread = excluded.unread",
        )?;
        for w in &params.whispers {
            upsert.execute(params![
                w.id,
                w.peer.id.as_str(),
                w.peer.login,
                w.peer.display_name,
                w.outgoing,
                w.text,
                w.timestamp,
                w.unread
            ])?;
        }
    }
    tx.execute(
        "DELETE FROM whispers WHERE id NOT IN (
            SELECT id FROM whispers ORDER BY timestamp DESC LIMIT ?1
        )",
        [KEPT],
    )?;
    tx.commit()?;
    Ok(())
}

pub fn list(db: &Connection) -> Result<Vec<Whisper>> {
    let mut query = db.prepare_cached(
        "SELECT * FROM (
            SELECT id, peer_id, peer_login, peer_name, outgoing, text, timestamp, unread
            FROM whispers ORDER BY timestamp DESC LIMIT ?1
        ) ORDER BY timestamp",
    )?;
    let rows = query.query_map([KEPT], whisper)?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

fn whisper(row: &Row) -> rusqlite::Result<Whisper> {
    Ok(Whisper {
        id: row.get(0)?,
        peer: UserRef::new(
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
        ),
        outgoing: row.get(4)?,
        text: row.get(5)?,
        timestamp: row.get(6)?,
        unread: row.get(7)?,
    })
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct MarkWhispersReadParams {
    pub peer_id: UserId,
}

pub fn mark_read(db: &Connection, params: MarkWhispersReadParams) -> Result<()> {
    db.execute(
        "UPDATE whispers SET unread = 0 WHERE peer_id = ?1 AND unread = 1",
        [params.peer_id.as_str()],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::platform::db::in_memory;

    fn whisper(id: &str, peer: &str, timestamp: u64) -> Whisper {
        Whisper {
            id: id.into(),
            peer: UserRef::new(peer, peer, peer),
            outgoing: false,
            text: "hi".into(),
            timestamp,
            unread: true,
        }
    }

    fn saved(whispers: Vec<Whisper>) -> Connection {
        let mut db = in_memory(&[SCHEMA]);
        save(&mut db, SaveWhispersParams { whispers }).unwrap();
        db
    }

    #[test]
    fn lists_oldest_first_and_saving_twice_keeps_one() {
        let db = saved(vec![
            whisper("b", "x", 2),
            whisper("a", "x", 1),
            whisper("b", "x", 2),
        ]);
        let ids: Vec<_> = list(&db).unwrap().into_iter().map(|w| w.id).collect();
        assert_eq!(ids, ["a", "b"]);
    }

    #[test]
    fn saving_drops_whispers_beyond_the_newest_kept() {
        let whispers = (0..=KEPT as u64)
            .map(|t| whisper(&t.to_string(), "x", t))
            .collect();
        let db = saved(whispers);
        let count: usize = db
            .query_row("SELECT COUNT(*) FROM whispers", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, KEPT);
        assert_eq!(list(&db).unwrap()[0].id, "1");
    }

    #[test]
    fn marking_read_touches_only_that_conversation() {
        let db = saved(vec![whisper("a", "x", 1), whisper("b", "y", 2)]);
        mark_read(
            &db,
            MarkWhispersReadParams {
                peer_id: UserId::from("x"),
            },
        )
        .unwrap();
        let unread: Vec<_> = list(&db).unwrap().into_iter().map(|w| w.unread).collect();
        assert_eq!(unread, [false, true]);
    }
}
