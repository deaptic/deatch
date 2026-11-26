# Releasing

The app and the browser extension ship separately, and any two versions work
together.

## App

First add a `## vX.Y.Z — D Month YYYY` section to `CHANGELOG.md` (the
`changelog` skill drafts it) and commit it. The release script refuses a version
without one, and the workflow puts the section on the GitHub Release page. The
app bundles `CHANGELOG.md` and shows every release on its "What's new" page,
opened from the title bar. The first time an updated copy starts, a popup shows
the summary and the `New` and `Improved` lines, with a button to that page; new
installs skip it.

Write for streamers and mods, not developers:

- Open with one sentence that sums up the release.
- Group changes under `### New`, `### Improved`, `### Fixed` and `### Removed`,
  using only the groups the release needs.
- One line per feature, not per commit, starting with what the user sees, most
  important first.
- Call buttons and settings what the screen calls them.
- Plain words: no code names, file names or technical terms.
- Plain text only in the lines: no bold, code marks or links. The app shows
  them as written.
- Leave out what nobody would notice: refactors, tests, CI, dependency updates.

```powershell
vp run release           # patch
vp run release minor | major | 1.2.3
```

This bumps the version in `package.json` (which `tauri.conf.json` reads),
`Cargo.toml`, and `Cargo.lock`, commits, tags `vX.Y.Z`, and pushes. It refuses
a dirty tree, any branch but `main`, a `main` that differs from its upstream,
and an explicit version that is not newer than the current one. If the push
fails, the commit and tag stay local and the script prints how to retry or undo.
The tag triggers `release.yml`, which runs the checks, builds with `tauri-action`,
signs the updater artifacts with the `TAURI_SIGNING_PRIVATE_KEY*` secrets, and
publishes a GitHub Release with the installers and `latest.json`.

Installed copies check `latest.json` on boot, every six hours, and on window
focus at most once an hour, then show an update banner. Clicking it saves
pending data, installs, and relaunches. The `pubkey` in `tauri.conf.json` must match
the signing secret; rotating one without the other breaks updates for every copy
out there.

## Extension

```powershell
vp run pack:extension minor   # patch | major | 1.2.3; omit to keep version
```

This writes one zip per browser into `extension/dist/`, each with a manifest
stripped to what that store accepts. It builds `extension/build/` first. The zips hold
bundled (unminified) code, so AMO asks for the source on upload: give it a zip
of the repository with the build steps `vp install` and `vp run build:extension`. Upload the Firefox one on the
[AMO Developer Hub](https://addons.mozilla.org/developers/), distributed "On
this site" (never add `update_url`; AMO rejects it). Upload the Chrome one on
the [Web Store dashboard](https://chrome.google.com/webstore/devconsole); it
carries no `key`, the store keeps the id it assigned, and Edge installs from
there too.

If the Chrome item is ever recreated, copy its new public key into
`extension/public/manifest.json` `key` and its id into `src-tauri/src/link/bridge.rs`, then
release the app. Reviews take days and land separately, which is fine. Copies
installed by hand never update.
