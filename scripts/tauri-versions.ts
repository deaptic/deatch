export type Mismatch = {
  npm: string;
  npmVersion: string;
  crate: string;
  crateVersion: string | null;
};

export function crateFor(npm: string): string | null {
  if (npm === "@tauri-apps/api") return "tauri";
  const plugin = /^@tauri-apps\/plugin-(.+)$/.exec(npm)?.[1];
  return plugin ? `tauri-plugin-${plugin}` : null;
}

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
