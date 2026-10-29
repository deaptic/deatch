// Usage: vp run check:tauri
//
// Fails when a @tauri-apps npm package and its Rust crate differ in
// major.minor, which tauri dev and tauri build refuse, or when the crate is
// missing, which leaves the package's calls failing at runtime.

import { readFile } from "node:fs/promises";
import { lockedVersions } from "./cargo-lock.ts";
import { mismatches } from "./tauri-versions.ts";

type Manifest = {
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

async function readManifest(path: string): Promise<Manifest> {
  return JSON.parse(await readFile(path, "utf8"));
}

const pkg = await readManifest("package.json");
const names = Object.keys({
  ...pkg.dependencies,
  ...pkg.devDependencies,
}).filter((name) => name.startsWith("@tauri-apps/"));
const npmVersions = new Map(
  await Promise.all(
    names.map(
      async (name) =>
        [
          name,
          (await readManifest(`node_modules/${name}/package.json`)).version,
        ] as const,
    ),
  ),
);
const crateVersions = lockedVersions(
  await readFile("src-tauri/Cargo.lock", "utf8"),
);

const found = mismatches(npmVersions, crateVersions);
for (const m of found) {
  console.error(
    `${m.npm} ${m.npmVersion} ≠ ${m.crate} ${m.crateVersion ?? "(not in Cargo.lock)"}`,
  );
}
if (found.length > 0) process.exit(1);
console.log("Tauri npm packages match their crates.");
