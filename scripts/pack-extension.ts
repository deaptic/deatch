// Usage:
//   pnpm pack:extension                 (no version change)
//   pnpm pack:extension patch | minor | major | 1.2.3
//
// Bumps the version in extension/manifest.json when asked, then builds
// extension/dist/deatch-link-{firefox,chrome}-<v>.zip, each with a manifest
// stripped to what that browser knows, so neither store warns about the
// other's keys.

import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "./run.ts";
import { nextVersion } from "./version.ts";

const SRC = "extension";
const OUT = `${SRC}/dist`;
const FILES = ["background.js", "compressor.js", "icons"];

const CHROME_ONLY = ["minimum_chrome_version"];
const FIREFOX_ONLY = ["browser_specific_settings"];
// The Web Store assigns the id and rejects uploads that carry `key`; it only
// serves unpacked loads.
const UNPACKED_ONLY = ["key"];

type Manifest = Record<string, unknown> & {
  version: string;
  background: Record<string, unknown>;
};

const MANIFEST = `${SRC}/manifest.json`;
let text = await readFile(MANIFEST, "utf8");

if (process.argv[2]) {
  const current = (JSON.parse(text) as Manifest).version;
  const next = nextVersion(current, process.argv[2]);
  console.log(`bumping ${current} → ${next}`);
  const bumped = text.replace(
    `"version": "${current}"`,
    `"version": "${next}"`,
  );
  if (bumped === text) throw new Error(`failed to bump version in ${MANIFEST}`);
  text = bumped;
  await writeFile(MANIFEST, text);
}

const manifest: Manifest = JSON.parse(text);

function strip(keys: string[], background: string): Manifest {
  const out = structuredClone(manifest);
  for (const key of keys) delete out[key];
  delete out.background[background];
  return out;
}

const targets = {
  firefox: strip([...CHROME_ONLY, ...UNPACKED_ONLY], "service_worker"),
  chrome: strip([...FIREFOX_ONLY, ...UNPACKED_ONLY], "scripts"),
};

/// Windows' own tar writes zips; a GNU tar earlier on PATH would not.
function windowsTar(): string {
  const root = process.env.SystemRoot;
  if (!root)
    throw new Error("SystemRoot is not set, so tar.exe can't be found");
  return join(root, "System32", "tar.exe");
}

async function pack(browser: string, manifest: Manifest): Promise<string> {
  const stage = await mkdtemp(join(tmpdir(), "deatch-link-"));
  try {
    await writeFile(
      `${stage}/manifest.json`,
      JSON.stringify(manifest, null, 2) + "\n",
    );
    for (const file of FILES) {
      await cp(`${SRC}/${file}`, `${stage}/${file}`, { recursive: true });
    }
    const zip = `${OUT}/deatch-link-${browser}-${manifest.version}.zip`;
    await mkdir(OUT, { recursive: true });
    await run([
      windowsTar(),
      "--format",
      "zip",
      "-cf",
      zip,
      "-C",
      stage,
      "manifest.json",
      ...FILES,
    ]);
    return zip;
  } finally {
    await rm(stage, { recursive: true });
  }
}

for (const [browser, manifest] of Object.entries(targets)) {
  console.log(await pack(browser, manifest));
}
