use std::fs;
use std::io;
use std::path::PathBuf;

/// `%LOCALAPPDATA%\Deatch`, created on demand.
pub fn local_dir() -> io::Result<PathBuf> {
    let local = std::env::var("LOCALAPPDATA")
        .map_err(|_| io::Error::new(io::ErrorKind::NotFound, "LOCALAPPDATA env var not set"))?;
    let dir = PathBuf::from(local).join("Deatch");
    fs::create_dir_all(&dir)?;
    Ok(dir)
}
