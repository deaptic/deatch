# Releasing

The app and the browser extension ship separately, and any two versions work
together.

## App

```powershell
pnpm release           # patch
pnpm release minor | major | 1.2.3
```

This bumps the version in `package.json`, `tauri.conf.json`, `Cargo.toml`, and
`Cargo.lock`, commits, tags `vX.Y.Z`, and pushes. It refuses a dirty tree. The
tag triggers `release.yml`, which runs the checks, builds with `tauri-action`,
signs the updater artifacts with the `TAURI_SIGNING_PRIVATE_KEY*` secrets, and
publishes a GitHub Release with the installers and `latest.json`.

Installed copies check `latest.json` on boot, every six hours, and on window
focus, then install and relaunch. The `pubkey` in `tauri.conf.json` must match
the signing secret; rotating one without the other breaks updates for every copy
out there.

## Extension

```powershell
pnpm pack:extension minor   # patch | major | 1.2.3; omit to keep version
```

This writes one zip per browser into `extension/dist/`, each with a manifest
stripped to what that store accepts. Upload the Firefox one on the
[AMO Developer Hub](https://addons.mozilla.org/developers/), distributed "On
this site" (never add `update_url`; AMO rejects it). Upload the Chrome one on
the [Web Store dashboard](https://chrome.google.com/webstore/devconsole); it
carries no `key`, the store keeps the id it assigned, and Edge installs from
there too.

If the Chrome item is ever recreated, copy its new public key into
`manifest.json` `key` and its id into `src-tauri/src/link/bridge.rs`, then
release the app. Reviews take days and land separately, which is fine. Copies
installed by hand never update.
