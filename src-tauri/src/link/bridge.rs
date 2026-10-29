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
pub(super) const FIREFOX_MANIFEST: &str = "deatch-host.json";
pub(super) const CHROME_ORIGIN_SCHEME: &str = "chrome-extension://";

const FIREFOX_REGISTRY_KEY: &str = r"Software\Mozilla\NativeMessagingHosts\com.deaptic.deatch";
const CHROMIUM_REGISTRY_KEYS: [&str; 2] = [
    r"Software\Google\Chrome\NativeMessagingHosts\com.deaptic.deatch",
    r"Software\Microsoft\Edge\NativeMessagingHosts\com.deaptic.deatch",
];

pub fn register() -> io::Result<()> {
    let dir = crate::local_dir::local_dir()?;
    let exe = std::env::current_exe()?;

    let firefox = write_manifest(
        &dir.join(FIREFOX_MANIFEST),
        &exe,
        "allowed_extensions",
        FIREFOX_EXTENSION_ID,
    )?;
    register_key(FIREFOX_REGISTRY_KEY, &firefox)?;

    let chromium = write_manifest(
        &dir.join("deatch-host-chromium.json"),
        &exe,
        "allowed_origins",
        &chrome_origin(),
    )?;
    for key in CHROMIUM_REGISTRY_KEYS {
        register_key(key, &chromium)?;
    }
    Ok(())
}

fn chrome_origin() -> String {
    format!("{CHROME_ORIGIN_SCHEME}{CHROME_EXTENSION_ID}/")
}

fn write_manifest(path: &Path, exe: &Path, allow_key: &str, allowed: &str) -> io::Result<PathBuf> {
    fs::write(path, manifest(exe, allow_key, allowed).to_string())?;
    Ok(path.to_path_buf())
}

fn manifest(exe: &Path, allow_key: &str, allowed: &str) -> serde_json::Value {
    serde_json::json!({
        "name": HOST_NAME,
        "description": "Deatch native messaging host",
        "path": exe.to_string_lossy(),
        "type": "stdio",
        allow_key: [allowed],
    })
}

fn register_key(subkey: &str, manifest: &Path) -> io::Result<()> {
    let (key, _) = RegKey::predef(HKEY_CURRENT_USER).create_subkey(subkey)?;
    key.set_value("", &manifest.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::{chrome_origin, manifest};
    use serde_json::json;
    use std::path::Path;

    #[test]
    fn chromium_manifest_allows_the_extension_origin_with_a_trailing_slash() {
        let manifest = manifest(
            Path::new(r"C:\Deatch\deatch.exe"),
            "allowed_origins",
            &chrome_origin(),
        );
        assert_eq!(
            manifest,
            json!({
                "name": "com.deaptic.deatch",
                "description": "Deatch native messaging host",
                "path": r"C:\Deatch\deatch.exe",
                "type": "stdio",
                "allowed_origins": ["chrome-extension://dmoblcekdcegdpjbbkhblfnjjefkagpd/"],
            })
        );
    }
}
