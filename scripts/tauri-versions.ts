export type Mismatch = {
  npm: string;
  npmVersion: string;
  crate: string;
  /// Null when the crate is not in Cargo.lock, so the package's calls fail.
  crateVersion: string | null;
};

/// The Rust crate an npm package must match, or null when it has none.
export function crateFor(npm: string): string | null {
  if (npm === "@tauri-apps/api") return "tauri";
  const plugin = /^@tauri-apps\/plugin-(.+)$/.exec(npm)?.[1];
  return plugin ? `tauri-plugin-${plugin}` : null;
}

/// Tauri refuses to run when a package and its crate differ in major.minor.
export function mismatches(
  npmVersions: Map<string, string>,
  crateVersions: Map<string, string>,
): Mismatch[] {
  const found: Mismatch[] = [];
  for (const [npm, npmVersion] of npmVersions) {
    const crate = crateFor(npm);
    if (!crate) continue;
    const crateVersion = crateVersions.get(crate) ?? null;
    if (crateVersion === null || minor(crateVersion) !== minor(npmVersion)) {
      found.push({ npm, npmVersion, crate, crateVersion });
    }
  }
  return found;
}

function minor(version: string): string {
  return version.split(".").slice(0, 2).join(".");
}
