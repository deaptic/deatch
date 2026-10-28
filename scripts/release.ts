// Usage:
//   pnpm release patch          (default)
//   pnpm release minor
//   pnpm release major
//   pnpm release 1.2.3
//
// Bumps version in package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml,
// commits with message "chore: release vX.Y.Z", tags vX.Y.Z, and pushes the
// current branch + tag. The release GitHub Action takes over from the tag.

import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { setLockedVersion } from "./cargo-lock.ts";
import { type Command, run } from "./run.ts";
import { nextVersion } from "./version.ts";

const execFileAsync = promisify(execFile);

const FILES = {
  pkg: "package.json",
  tauri: "src-tauri/tauri.conf.json",
  cargo: "src-tauri/Cargo.toml",
  cargoLock: "src-tauri/Cargo.lock",
};

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n");
}

async function patchCargo(path: string, newVersion: string): Promise<void> {
  const text = await readFile(path, "utf8");
  const patched = text.replace(
    /^version\s*=\s*"[^"]+"/m,
    `version = "${newVersion}"`,
  );
  if (patched === text) throw new Error(`failed to bump version in ${path}`);
  await writeFile(path, patched);
}

async function patchCargoLock(
  path: string,
  name: string,
  newVersion: string,
): Promise<void> {
  const text = await readFile(path, "utf8");
  await writeFile(path, setLockedVersion(text, name, newVersion));
}

async function captureStdout([command, ...args]: Command): Promise<string> {
  const { stdout } = await execFileAsync(command, args);
  return stdout.trimEnd();
}

const pkg = await readJson(FILES.pkg);
const current = pkg.version as string;
const next = nextVersion(current, process.argv[2]);

const status = await captureStdout(["git", "status", "--porcelain"]);
if (status) {
  console.error(
    "working tree has uncommitted changes — commit or stash first:",
  );
  console.error(status);
  process.exit(1);
}

const tag = `v${next}`;
if (await captureStdout(["git", "tag", "--list", tag])) {
  console.error(`tag ${tag} already exists`);
  process.exit(1);
}
const branch = await captureStdout([
  "git",
  "rev-parse",
  "--abbrev-ref",
  "HEAD",
]);

console.log(`bumping ${current} → ${next}`);

pkg.version = next;
await writeJson(FILES.pkg, pkg);

const tauri = await readJson(FILES.tauri);
tauri.version = next;
await writeJson(FILES.tauri, tauri);

await patchCargo(FILES.cargo, next);
await patchCargoLock(FILES.cargoLock, "deatch", next);

await run(["git", "add", FILES.pkg, FILES.tauri, FILES.cargo, FILES.cargoLock]);
await run(["git", "commit", "-m", `chore: release ${tag}`]);
await run(["git", "tag", tag]);
await run(["git", "push", "--atomic", "origin", branch, tag]);

console.log(
  `released ${tag} from ${branch} — GitHub Action will build and publish.`,
);
