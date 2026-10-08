// Usage:
//   deno task pack:extension                 (no version change)
//   deno task pack:extension patch | minor | major | 1.2.3
//
// Bumps the version in extension/manifest.json when asked, then builds
// extension/dist/deatch-link-{firefox,chrome}-<v>.zip, each with a manifest
// stripped to what that browser knows, so neither store warns about the
// other's keys.

import { nextVersion } from "./version.ts";

const SRC = "extension";
const OUT = `${SRC}/dist`;
const FILES = ["background.js", "icons"];

const CHROME_ONLY = ["key", "minimum_chrome_version"];
const FIREFOX_ONLY = ["browser_specific_settings"];

type Manifest = Record<string, unknown> & {
  version: string;
  background: Record<string, unknown>;
};

const MANIFEST = `${SRC}/manifest.json`;
let text = await Deno.readTextFile(MANIFEST);

if (Deno.args[0]) {
  const current = (JSON.parse(text) as Manifest).version;
  const next = nextVersion(current, Deno.args[0]);
  console.log(`bumping ${current} → ${next}`);
  text = text.replace(`"version": "${current}"`, `"version": "${next}"`);
  await Deno.writeTextFile(MANIFEST, text);
}

const manifest: Manifest = JSON.parse(text);

function strip(keys: string[], background: string): Manifest {
  const out = structuredClone(manifest);
  for (const key of keys) delete out[key];
  delete out.background[background];
  return out;
}

const targets = {
  firefox: strip(CHROME_ONLY, "service_worker"),
  chrome: strip(FIREFOX_ONLY, "scripts"),
};

async function pack(browser: string, manifest: Manifest): Promise<string> {
  const stage = await Deno.makeTempDir();
  await Deno.writeTextFile(
    `${stage}/manifest.json`,
    JSON.stringify(manifest, null, 2) + "\n",
  );
  for (const file of FILES) {
    await copy(`${SRC}/${file}`, `${stage}/${file}`);
  }
  const zip = `${OUT}/deatch-link-${browser}-${manifest.version}.zip`;
  await Deno.mkdir(OUT, { recursive: true });
  await run([
    "powershell",
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${stage}\\*' -DestinationPath '${zip}' -Force`,
  ]);
  await Deno.remove(stage, { recursive: true });
  return zip;
}

async function copy(from: string, to: string): Promise<void> {
  if ((await Deno.stat(from)).isDirectory) {
    await Deno.mkdir(to);
    for await (const entry of Deno.readDir(from)) {
      await copy(`${from}/${entry.name}`, `${to}/${entry.name}`);
    }
  } else {
    await Deno.copyFile(from, to);
  }
}

async function run(cmd: string[]): Promise<void> {
  const p = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = await p.output();
  if (code !== 0) throw new Error(`${cmd.join(" ")} exited with ${code}`);
}

for (const [browser, manifest] of Object.entries(targets)) {
  console.log(await pack(browser, manifest));
}
