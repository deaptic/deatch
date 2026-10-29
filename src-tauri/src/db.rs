//! Each account's own SQLite database, for the data that belongs to whoever is
//! signed in (the feed log now, caches later). Features own their tables: each
//! declares a `Schema`, and this module only opens files and applies the steps
//! a database has not had yet.

use crate::error::Result;
use crate::twitch::ids::UserId;
use rusqlite::{Connection, OptionalExtension};
use std::collections::hash_map::Entry;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard};
use tauri::Manager;

/// A feature's tables: `steps[n]` takes them from version n to n + 1. Steps are
/// only appended; one that has shipped never changes.
pub struct Schema {
    pub feature: &'static str,
    pub steps: &'static [&'static str],
}

type Shared = Arc<Mutex<Connection>>;

pub struct Databases {
    dir: PathBuf,
    schemas: &'static [Schema],
    open: Mutex<HashMap<UserId, Shared>>,
}

impl Databases {
    pub fn open(schemas: &'static [Schema]) -> Result<Self> {
        let dir = crate::local_dir::local_dir()?.join("data");
        std::fs::create_dir_all(&dir)?;
        Ok(Self {
            dir,
            schemas,
            open: Mutex::default(),
        })
    }

    /// Runs `work` on `account`'s database, opening and preparing it the first
    /// time and keeping it open. Blocking: call from a blocking thread.
    pub fn with<R>(
        &self,
        account: &UserId,
        work: impl FnOnce(&mut Connection) -> Result<R>,
    ) -> Result<R> {
        let conn = {
            let mut open = lock(&self.open);
            match open.entry(account.clone()) {
                Entry::Occupied(e) => e.get().clone(),
                Entry::Vacant(e) => e
                    .insert(Arc::new(Mutex::new(self.connect(account)?)))
                    .clone(),
            }
        };
        let mut conn = lock(&conn);
        work(&mut conn)
    }

    pub fn upkeep<R>(
        &self,
        account: &UserId,
        work: impl FnOnce(&mut Connection) -> Result<R>,
    ) -> Result<R> {
        let cached = lock(&self.open).get(account).cloned();
        if let Some(conn) = cached {
            return work(&mut lock(&conn));
        }
        let mut conn = self.connect(account)?;
        let result = work(&mut conn);
        close(account, conn);
        result
    }

    /// Closes every open database, which folds its write-ahead log back into
    /// the file and removes the log; for app exit.
    pub fn close(&self) {
        for (account, conn) in lock(&self.open).drain() {
            match Arc::into_inner(conn) {
                Some(conn) => close(
                    &account,
                    conn.into_inner().unwrap_or_else(|e| e.into_inner()),
                ),
                None => log::warn!("database for {account} still in use, not closed cleanly"),
            }
        }
    }

    /// Every account with a database, signed in or not, for upkeep.
    pub fn accounts(&self) -> Result<Vec<UserId>> {
        let mut accounts = Vec::new();
        for entry in std::fs::read_dir(&self.dir)? {
            let name = entry?.file_name();
            if let Some(id) = name.to_str().and_then(|n| n.strip_suffix(".sqlite")) {
                accounts.push(UserId::from(id));
            }
        }
        Ok(accounts)
    }

    fn connect(&self, account: &UserId) -> Result<Connection> {
        connect(&self.dir.join(format!("{account}.sqlite")), self.schemas)
    }
}

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(|e| e.into_inner())
}

fn close(account: &UserId, conn: Connection) {
    if let Err((_, e)) = conn.close() {
        log::warn!("database for {account} not closed cleanly: {e}");
    }
}

pub async fn run<R: Send + 'static>(
    app: tauri::AppHandle,
    account: UserId,
    work: impl FnOnce(&mut Connection) -> Result<R> + Send + 'static,
) -> Result<R> {
    crate::blocking::run(app, move |app| {
        app.state::<Databases>().with(&account, work)
    })
    .await?
}

fn connect(path: &Path, schemas: &[Schema]) -> Result<Connection> {
    let mut conn = Connection::open(path)?;
    prepare(&mut conn, schemas)?;
    Ok(conn)
}

/// The settings every database runs with, then each feature's pending steps.
fn prepare(conn: &mut Connection, schemas: &[Schema]) -> Result<()> {
    // Takes effect only before the first table exists; without it the file
    // never shrinks after rows are deleted.
    conn.pragma_update(None, "auto_vacuum", "INCREMENTAL")?;
    conn.pragma_update_and_check(None, "journal_mode", "WAL", |_| Ok(()))?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema (
            feature TEXT PRIMARY KEY,
            version INTEGER NOT NULL
        )",
    )?;
    for schema in schemas {
        let tx = conn.transaction()?;
        let version: i64 = tx
            .query_row(
                "SELECT version FROM schema WHERE feature = ?1",
                [schema.feature],
                |row| row.get(0),
            )
            .optional()?
            .unwrap_or(0);
        let done = usize::try_from(version).unwrap_or(0);
        // A database from a newer build keeps the steps it already has.
        if let Some(pending) = schema.steps.get(done..).filter(|p| !p.is_empty()) {
            for step in pending {
                tx.execute_batch(step)?;
            }
            tx.execute(
                "INSERT INTO schema (feature, version) VALUES (?1, ?2)
                 ON CONFLICT (feature) DO UPDATE SET version = excluded.version",
                (schema.feature, schema.steps.len()),
            )?;
        }
        tx.commit()?;
    }
    Ok(())
}

/// A prepared database in memory, for tests of the features that use one.
#[cfg(test)]
pub fn in_memory(schemas: &[Schema]) -> Connection {
    let mut conn = Connection::open_in_memory().unwrap();
    prepare(&mut conn, schemas).unwrap();
    conn
}

#[cfg(test)]
mod tests {
    use super::*;

    const V1: Schema = Schema {
        feature: "notes",
        steps: &["CREATE TABLE notes (text TEXT)"],
    };
    const V2: Schema = Schema {
        feature: "notes",
        steps: &[
            "CREATE TABLE notes (text TEXT)",
            "ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0",
        ],
    };

    fn version(conn: &Connection) -> i64 {
        conn.query_row(
            "SELECT version FROM schema WHERE feature = 'notes'",
            [],
            |r| r.get(0),
        )
        .unwrap()
    }

    #[test]
    fn applies_only_the_steps_a_database_has_not_had() {
        let mut conn = in_memory(&[V1]);
        conn.execute("INSERT INTO notes (text) VALUES ('kept')", [])
            .unwrap();
        prepare(&mut conn, &[V1]).unwrap();
        assert_eq!(version(&conn), 1);

        prepare(&mut conn, &[V2]).unwrap();
        assert_eq!(version(&conn), 2);
        let (text, pinned): (String, i64) = conn
            .query_row("SELECT text, pinned FROM notes", [], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .unwrap();
        assert_eq!((text.as_str(), pinned), ("kept", 0));
    }

    #[test]
    fn a_newer_database_is_left_as_it_is() {
        let mut conn = in_memory(&[V2]);
        prepare(&mut conn, &[V1]).unwrap();
        assert_eq!(version(&conn), 2);
    }
}
