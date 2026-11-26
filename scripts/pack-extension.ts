import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  bundleExtension,
  EXTENSION_BUILD,
  EXTENSION_MANIFEST,
} from "./extension-bundle.ts";
import { run } from "./run.ts";
import { nextVersion } from "./version.ts";

const OUT = "extension/dist";

const CHROME_ONLY = ["minimum_chrome_version"];
const FIREFOX_ONLY = ["browser_specific_settings"];
const UNPACKED_ONLY = ["key"];

type Manifest = Record<string, unknown> & {
  version: string;
  background: Record<string, unknown>;
};

const MANIFEST = EXTENSION_MANIFEST;
await bundleExtension();
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

function windowsTar(): string {
  const root = process.env.SystemRoot;
  if (!root)
    throw new Error("SystemRoot is not set, so tar.exe can't be found");
  return join(root, "System32", "tar.exe");
}

async function pack(browser: string, manifest: Manifest): Promise<string> {
  const stage = await mkdtemp(join(tmpdir(), "deatch-link-"));
  try {
    await cp(EXTENSION_BUILD, stage, { recursive: true });
    await writeFile(
      `${stage}/manifest.json`,
      JSON.stringify(manifest, null, 2) + "\n",
    );
    const files = await readdir(stage);
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
      ...files,
    ]);
    return zip;
  } finally {
    await rm(stage, { recursive: true });
  }
}

for (const [browser, manifest] of Object.entries(targets)) {
  console.log(await pack(browser, manifest));
}
