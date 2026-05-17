// Browser-bridge registration. Idempotent: re-running with unchanged values
// is a no-op, so calling on every GUI launch is fine.

use std::fs;
use std::io;
use std::path::PathBuf;

const HOST_NAME: &str = "com.deaptic.deatch";
const EXTENSION_ID: &str = "deatch-link@deaptic.com";
const MANIFEST_FILENAME: &str = "deatch-host.json";

#[cfg(windows)]
const FIREFOX_REGISTRY_KEY: &str =
    r"Software\Mozilla\NativeMessagingHosts\com.deaptic.deatch";

fn manifest_dir() -> io::Result<PathBuf> {
    let local = std::env::var("LOCALAPPDATA").map_err(|_| {
        io::Error::new(io::ErrorKind::NotFound, "LOCALAPPDATA env var not set")
    })?;
    let dir = PathBuf::from(local).join("Deatch");
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

fn manifest_path() -> io::Result<PathBuf> {
    Ok(manifest_dir()?.join(MANIFEST_FILENAME))
}

fn build_manifest(exe: &std::path::Path) -> String {
    serde_json::json!({
        "name": HOST_NAME,
        "description": "Deatch native messaging host",
        "path": exe.to_string_lossy(),
        "type": "stdio",
        "allowed_extensions": [EXTENSION_ID],
    })
    .to_string()
}

pub fn register() -> io::Result<()> {
    let exe = std::env::current_exe()?;
    let manifest = build_manifest(&exe);
    let path = manifest_path()?;
    fs::write(&path, manifest)?;

    #[cfg(windows)]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (key, _) = hkcu.create_subkey(FIREFOX_REGISTRY_KEY)?;
        key.set_value("", &path.to_string_lossy().to_string())?;
    }

    Ok(())
}

#[allow(dead_code)]
pub fn unregister() -> io::Result<()> {
    #[cfg(windows)]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let _ = hkcu.delete_subkey(FIREFOX_REGISTRY_KEY);
    }

    let path = manifest_path()?;
    if path.exists() {
        fs::remove_file(path)?;
    }
    Ok(())
}
