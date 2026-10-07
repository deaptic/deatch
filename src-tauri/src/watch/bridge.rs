// Browser-bridge registration. Idempotent: re-running with unchanged values
// is a no-op, so calling on every GUI launch is fine.

use std::fs;
use std::io;
use std::path::PathBuf;

use winreg::enums::HKEY_CURRENT_USER;
use winreg::RegKey;

const HOST_NAME: &str = "com.deaptic.deatch";
const EXTENSION_ID: &str = "deatch-link@deaptic.com";
const MANIFEST_FILENAME: &str = "deatch-host.json";
const FIREFOX_REGISTRY_KEY: &str = r"Software\Mozilla\NativeMessagingHosts\com.deaptic.deatch";

pub fn register() -> io::Result<()> {
    let local = std::env::var("LOCALAPPDATA")
        .map_err(|_| io::Error::new(io::ErrorKind::NotFound, "LOCALAPPDATA env var not set"))?;
    let dir = PathBuf::from(local).join("Deatch");
    fs::create_dir_all(&dir)?;
    let path = dir.join(MANIFEST_FILENAME);

    let manifest = serde_json::json!({
        "name": HOST_NAME,
        "description": "Deatch native messaging host",
        "path": std::env::current_exe()?.to_string_lossy(),
        "type": "stdio",
        "allowed_extensions": [EXTENSION_ID],
    });
    fs::write(&path, manifest.to_string())?;

    let (key, _) = RegKey::predef(HKEY_CURRENT_USER).create_subkey(FIREFOX_REGISTRY_KEY)?;
    key.set_value("", &path.to_string_lossy().to_string())
}
