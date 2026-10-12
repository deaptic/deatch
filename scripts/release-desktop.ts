// Usage:
//   deno task release:desktop patch          (default)
//   deno task release:desktop minor
//   deno task release:desktop major
//   deno task release:desktop 1.2.3
//
// Bumps the desktop app version in package.json, src-tauri/tauri.conf.json,
// src-tauri/Cargo.toml and Cargo.lock. Committing, tagging vX.Y.Z and pushing
// is up to you; the release GitHub Action takes over from the tag.

import { nextVersion } from "./version.ts";

const APP = "apps/desktop";
const FILES = {
  pkg: `${APP}/package.json`,
  tauri: `${APP}/src-tauri/tauri.conf.json`,
  cargo: `${APP}/src-tauri/Cargo.toml`,
  cargoLock: `${APP}/src-tauri/Cargo.lock`,
};

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await Deno.readTextFile(path));
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await Deno.writeTextFile(path, JSON.stringify(data, null, 2) + "\n");
}

async function patchCargo(path: string, newVersion: string): Promise<void> {
  const text = await Deno.readTextFile(path);
  const patched = text.replace(
    /^version\s*=\s*"[^"]+"/m,
    `version = "${newVersion}"`,
  );
  if (patched === text) throw new Error(`failed to bump version in ${path}`);
  await Deno.writeTextFile(path, patched);
}

async function patchCargoLock(
  path: string,
  name: string,
  newVersion: string,
): Promise<void> {
  const text = await Deno.readTextFile(path);
  const re = new RegExp(
    `(\\[\\[package\\]\\]\\r?\\nname = "${name}"\\r?\\nversion = ")[^"]+(")`,
  );
  const patched = text.replace(re, `$1${newVersion}$2`);
  if (patched === text) throw new Error(`failed to bump ${name} in ${path}`);
  await Deno.writeTextFile(path, patched);
}

const pkg = await readJson(FILES.pkg);
const current = pkg.version as string;
const next = nextVersion(current, Deno.args[0]);

console.log(`bumping ${current} → ${next}`);

pkg.version = next;
await writeJson(FILES.pkg, pkg);

const tauri = await readJson(FILES.tauri);
tauri.version = next;
await writeJson(FILES.tauri, tauri);

await patchCargo(FILES.cargo, next);
await patchCargoLock(FILES.cargoLock, "deatch", next);

const tag = `v${next}`;
console.log(
  `bumped. To release: git commit -am "chore: release ${tag}" && git tag ${tag} && git push origin HEAD ${tag}`,
);
