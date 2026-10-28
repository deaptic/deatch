//! Feed history on disk, so the feed can page back past what it holds in
//! memory. One folder per signed-in account, so what one account saw (as a
//! moderator, say) is never shown to another; one file per channel per hour
//! inside it. Entries are the frontend's own JSON, stored and returned
//! untouched.

pub mod commands;
mod lines;

use crate::clock::unix_ms;
use crate::error::{Error, Result};
use crate::twitch::ids::UserId;
use lines::{HourFile, Line};
use serde::Deserialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;

/// Matches the inbox, so every mention it keeps can still be opened in place.
const MAX_AGE_MS: u64 = 7 * 24 * lines::HOUR_MS;
const MAX_BYTES: u64 = 1 << 30;
const PRUNE_EVERY: Duration = Duration::from_secs(60 * 60);

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
    /// When the entry was sent, if known; the search starts at its hour.
    #[serde(default)]
    pub timestamp: Option<u64>,
    pub limit: usize,
}

pub struct FeedLog {
    dir: PathBuf,
    writes: Mutex<()>,
}

impl FeedLog {
    pub fn open() -> Result<Self> {
        let dir = crate::local_dir::local_dir()?.join("logs").join("feed");
        fs::create_dir_all(&dir)?;
        Ok(Self {
            dir,
            writes: Mutex::new(()),
        })
    }

    fn channel_dir(&self, viewer: &UserId, broadcaster_id: &UserId) -> PathBuf {
        self.dir.join(viewer.as_str()).join(broadcaster_id.as_str())
    }

    pub fn append(&self, viewer: &UserId, params: AppendParams) -> Result<()> {
        let AppendParams {
            broadcaster_id,
            entries,
        } = params;
        if let Some(bad) = entries
            .iter()
            .find(|e| e.id.contains(['\t', '\n']) || e.entry.contains('\n'))
        {
            return Err(Error::Invalid(format!("unloggable entry {}", bad.id)));
        }
        let dir = self.channel_dir(viewer, &broadcaster_id);
        let _guard = self.writes.lock().unwrap_or_else(|e| e.into_inner());
        fs::create_dir_all(&dir)?;
        let mut by_hour: std::collections::BTreeMap<u64, String> = Default::default();
        for e in &entries {
            by_hour
                .entry(lines::hour_of(e.timestamp))
                .or_default()
                .push_str(&lines::format(e.timestamp, &e.id, &e.entry));
        }
        for (hour, text) in by_hour {
            fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(hour_path(&dir, hour))?
                .write_all(text.as_bytes())?;
        }
        Ok(())
    }

    pub fn page(&self, viewer: &UserId, params: PageParams) -> Result<Vec<String>> {
        let dir = self.channel_dir(viewer, &params.broadcaster_id);
        Ok(match params.cursor {
            Cursor::Before { timestamp } => read_before(&dir, timestamp, params.limit)?,
            Cursor::After { timestamp } => read_after(&dir, timestamp, params.limit)?,
        })
    }

    /// The entries around `id`, oldest first and including it; None when the
    /// log no longer has it.
    pub fn around(&self, viewer: &UserId, params: AroundParams) -> Result<Option<Vec<String>>> {
        let dir = self.channel_dir(viewer, &params.broadcaster_id);
        let Some(timestamp) = find(&dir, &params.id, params.timestamp)? else {
            return Ok(None);
        };
        let half = params.limit / 2;
        let mut out = read_before(&dir, timestamp + 1, half + 1)?;
        out.extend(read_after(&dir, timestamp, half)?);
        Ok(Some(out))
    }

    pub fn prune(&self) -> Result<()> {
        let _guard = self.writes.lock().unwrap_or_else(|e| e.into_inner());
        let mut files = Vec::new();
        for account in subdirs(&self.dir)? {
            for channel in subdirs(&account)? {
                let relative = channel.strip_prefix(&self.dir).unwrap_or(&channel);
                for hour in hours(&channel)? {
                    let bytes = fs::metadata(hour_path(&channel, hour))?.len();
                    files.push(HourFile {
                        channel: relative.to_string_lossy().into_owned(),
                        hour,
                        bytes,
                    });
                }
            }
        }
        for file in lines::to_prune(files, unix_ms(), MAX_AGE_MS, MAX_BYTES) {
            let dir = self.dir.join(&file.channel);
            fs::remove_file(hour_path(&dir, file.hour))?;
            if hours(&dir)?.is_empty() {
                fs::remove_dir(&dir)?;
            }
        }
        for account in subdirs(&self.dir)? {
            if subdirs(&account)?.is_empty() {
                fs::remove_dir(&account)?;
            }
        }
        Ok(())
    }
}

/// Prunes now and then every hour, for as long as the app runs.
pub fn spawn_pruning(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            let pruned =
                crate::blocking::run(app.clone(), |app| app.state::<FeedLog>().prune()).await;
            if let Err(e) = pruned.and_then(|r| r) {
                log::warn!("feed log prune failed: {e}");
            }
            tokio::time::sleep(PRUNE_EVERY).await;
        }
    });
}

/// The folders directly inside `dir`.
fn subdirs(dir: &Path) -> Result<Vec<PathBuf>> {
    let mut out = Vec::new();
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            out.push(entry.path());
        }
    }
    Ok(out)
}

fn hour_path(dir: &Path, hour: u64) -> PathBuf {
    dir.join(format!("{hour}.jsonl"))
}

/// The hours a channel has files for, oldest first.
fn hours(dir: &Path) -> Result<Vec<u64>> {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(e.into()),
    };
    let mut hours: Vec<u64> = entries
        .filter_map(|e| e.ok())
        .filter_map(|e| e.file_name().to_str()?.strip_suffix(".jsonl")?.parse().ok())
        .collect();
    hours.sort_unstable();
    Ok(hours)
}

fn read_hour(dir: &Path, hour: u64) -> Result<String> {
    match fs::read_to_string(hour_path(dir, hour)) {
        Ok(text) => Ok(text),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(e) => Err(e.into()),
    }
}

/// Reads hour files in `hours` order until `enough` says the lines gathered
/// can answer; returns every line read.
fn read_from<'a>(
    texts: &'a mut Vec<String>,
    dir: &Path,
    hours: impl Iterator<Item = u64>,
    enough: impl Fn(&[Line<'_>]) -> bool,
) -> Result<Vec<Line<'a>>> {
    for hour in hours {
        texts.push(read_hour(dir, hour)?);
        let gathered: Vec<Line<'_>> = texts.iter().flat_map(|t| lines::parse(t)).collect();
        if enough(&gathered) {
            break;
        }
    }
    let texts: &'a Vec<String> = texts;
    Ok(texts.iter().flat_map(|t| lines::parse(t)).collect())
}

fn read_before(dir: &Path, timestamp: u64, limit: usize) -> Result<Vec<String>> {
    let start = lines::hour_of(timestamp);
    let hours: Vec<u64> = hours(dir)?
        .into_iter()
        .filter(|&h| h <= start)
        .rev()
        .collect();
    let mut texts = Vec::new();
    let gathered = read_from(&mut texts, dir, hours.into_iter(), |ls| {
        lines::before(ls.to_vec(), timestamp, limit).len() >= limit
    })?;
    Ok(owned(lines::before(gathered, timestamp, limit)))
}

fn read_after(dir: &Path, timestamp: u64, limit: usize) -> Result<Vec<String>> {
    let start = lines::hour_of(timestamp);
    let hours: Vec<u64> = hours(dir)?.into_iter().filter(|&h| h >= start).collect();
    let mut texts = Vec::new();
    let gathered = read_from(&mut texts, dir, hours.into_iter(), |ls| {
        lines::after(ls.to_vec(), timestamp, limit).len() >= limit
    })?;
    Ok(owned(lines::after(gathered, timestamp, limit)))
}

/// When `id` was logged, searching from the hinted hour or else newest first.
fn find(dir: &Path, id: &str, hint: Option<u64>) -> Result<Option<u64>> {
    let mut order = hours(dir)?;
    order.reverse();
    if let Some(hint) = hint {
        let near = lines::hour_of(hint);
        order.sort_by_key(|&h| h.abs_diff(near));
    }
    for hour in order {
        let text = read_hour(dir, hour)?;
        if let Some(line) = lines::parse(&text).into_iter().find(|l| l.id == id) {
            return Ok(Some(line.timestamp));
        }
    }
    Ok(None)
}

fn owned(lines: Vec<Line<'_>>) -> Vec<String> {
    lines.into_iter().map(|l| l.entry.to_string()).collect()
}
