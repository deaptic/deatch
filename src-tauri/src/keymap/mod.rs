pub mod commands;

use crate::error::Result;
use std::path::Path;

const FILE_NAME: &str = "keymap.json";

pub fn read(dir: &Path) -> Result<String> {
    let path = dir.join(FILE_NAME);
    if !path.exists() {
        return Ok(String::new());
    }
    Ok(std::fs::read_to_string(&path)?)
}
