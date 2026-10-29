// Usage:
//   vp run release patch          (default)
//   vp run release minor
//   vp run release major
//   vp run release 1.2.3
//
// Bumps version in package.json (tauri.conf.json reads it from there),
// src-tauri/Cargo.toml and src-tauri/Cargo.lock, commits with message
// "chore: release vX.Y.Z", tags vX.Y.Z, and pushes main + tag. The release
// GitHub Action takes over from the tag.

import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { branchBlocker, parseSync, syncBlocker } from "./branch.ts";
import { setLockedVersion } from "./cargo-lock.ts";
import { type Command, run } from "./run.ts";
import { nextVersion } from "./version.ts";

const execFileAsync = promisify(execFile);

const FILES = {
  pkg: "package.json",
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

function fail(...lines: string[]): never {
  for (const line of lines) console.error(line);
  process.exit(1);
}

const pkg = await readJson(FILES.pkg);
const current = pkg.version as string;
const next = nextVersion(current, process.argv[2]);

const status = await captureStdout(["git", "status", "--porcelain"]);
if (status) {
  fail("working tree has uncommitted changes — commit or stash first:", status);
}

const branch = await captureStdout([
  "git",
  "rev-parse",
  "--abbrev-ref",
  "HEAD",
]);
const branchProblem = branchBlocker(branch);
if (branchProblem) fail(branchProblem);

await run(["git", "fetch", "--tags", "origin"]);
const sync = parseSync(
  await captureStdout([
    "git",
    "rev-list",
    "--left-right",
    "--count",
    "HEAD...@{upstream}",
  ]),
);
const syncProblem = syncBlocker(branch, sync);
if (syncProblem) fail(syncProblem);

const tag = `v${next}`;
if (await captureStdout(["git", "tag", "--list", tag])) {
  fail(`tag ${tag} already exists`);
}

console.log(`bumping ${current} → ${next}`);

pkg.version = next;
await writeJson(FILES.pkg, pkg);
await patchCargo(FILES.cargo, next);
await patchCargoLock(FILES.cargoLock, "deatch", next);

await run(["git", "add", FILES.pkg, FILES.cargo, FILES.cargoLock]);
await run(["git", "commit", "-m", `chore: release ${tag}`]);
await run(["git", "tag", tag]);
try {
  await run(["git", "push", "--atomic", "origin", branch, tag]);
} catch (e) {
  fail(
    `push failed: ${String(e)}`,
    `the release commit and tag ${tag} exist only locally. Either retry:`,
    `  git push --atomic origin ${branch} ${tag}`,
    "or undo them:",
    `  git tag -d ${tag} && git reset --keep HEAD~1`,
  );
}

console.log(
  `released ${tag} from ${branch} — GitHub Action will build and publish.`,
);
