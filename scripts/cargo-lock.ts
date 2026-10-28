const ENTRY = /\[\[package\]\]\r?\nname = "([^"]+)"\r?\nversion = "([^"]+)"/g;

/// Crate name → locked version. A crate locked at several versions keeps the
/// last one.
export function lockedVersions(lock: string): Map<string, string> {
  const versions = new Map<string, string>();
  for (const [, name, version] of lock.matchAll(ENTRY)) {
    if (name && version) versions.set(name, version);
  }
  return versions;
}

/// Sets the first locked entry of `name`; throws when it is not locked.
export function setLockedVersion(
  lock: string,
  name: string,
  version: string,
): string {
  let found = false;
  const next = lock.replace(ENTRY, (entry, entryName: string) => {
    if (found || entryName !== name) return entry;
    found = true;
    return entry.replace(/version = "[^"]+"$/, `version = "${version}"`);
  });
  if (!found) throw new Error(`${name} is not in Cargo.lock`);
  return next;
}
