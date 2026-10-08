// Browser-bridge registration. Idempotent: re-running with unchanged values
// is a no-op, so calling on every GUI launch is fine.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use winreg::enums::HKEY_CURRENT_USER;
use winreg::RegKey;

const HOST_NAME: &str = "com.deaptic.deatch";
const FIREFOX_EXTENSION_ID: &str = "deatch-link@deaptic.com";
/// Derived from the `key` in extension/manifest.json; changes only if that
/// key changes.
const CHROME_EXTENSION_ID: &str = "dmoblcekdcegdpjbbkhblfnjjefkagpd";

const FIREFOX_REGISTRY_KEY: &str = r"Software\Mozilla\NativeMessagingHosts\com.deaptic.deatch";
const CHROMIUM_REGISTRY_KEYS: [&str; 2] = [
    r"Software\Google\Chrome\NativeMessagingHosts\com.deaptic.deatch",
    r"Software\Microsoft\Edge\NativeMessagingHosts\com.deaptic.deatch",
];

pub fn register() -> io::Result<()> {
    let local = std::env::var("LOCALAPPDATA")
        .map_err(|_| io::Error::new(io::ErrorKind::NotFound, "LOCALAPPDATA env var not set"))?;
    let dir = PathBuf::from(local).join("Deatch");
    fs::create_dir_all(&dir)?;
    let exe = std::env::current_exe()?;

    let firefox = write_manifest(
        &dir.join("deatch-host.json"),
        &exe,
        "allowed_extensions",
        FIREFOX_EXTENSION_ID,
    )?;
    register_key(FIREFOX_REGISTRY_KEY, &firefox)?;

    let chromium = write_manifest(
        &dir.join("deatch-host-chromium.json"),
        &exe,
        "allowed_origins",
        &format!("chrome-extension://{CHROME_EXTENSION_ID}/"),
    )?;
    for key in CHROMIUM_REGISTRY_KEYS {
        register_key(key, &chromium)?;
    }
    Ok(())
}

fn write_manifest(path: &Path, exe: &Path, allow_key: &str, allowed: &str) -> io::Result<PathBuf> {
    let manifest = serde_json::json!({
        "name": HOST_NAME,
        "description": "Deatch native messaging host",
        "path": exe.to_string_lossy(),
        "type": "stdio",
        allow_key: [allowed],
    });
    fs::write(path, manifest.to_string())?;
    Ok(path.to_path_buf())
}

fn register_key(subkey: &str, manifest: &Path) -> io::Result<()> {
    let (key, _) = RegKey::predef(HKEY_CURRENT_USER).create_subkey(subkey)?;
    key.set_value("", &manifest.to_string_lossy().to_string())
}
