// Usage:
//   deno task release patch          (default)
//   deno task release minor
//   deno task release major
//   deno task release 1.2.3
//
// Bumps version in package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml,
// commits with message "chore: release vX.Y.Z", tags vX.Y.Z, and pushes the
// current branch + tag. The release GitHub Action takes over from the tag.

const FILES = {
  pkg: "package.json",
  tauri: "src-tauri/tauri.conf.json",
  cargo: "src-tauri/Cargo.toml",
};

function bump(current: string, kind: "patch" | "minor" | "major"): string {
  const [maj, min, pat] = current.split(".").map((n) => parseInt(n, 10));
  if ([maj, min, pat].some(Number.isNaN)) {
    throw new Error(`unparseable current version: ${current}`);
  }
  if (kind === "major") return `${maj + 1}.0.0`;
  if (kind === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

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

async function run(cmd: string[]): Promise<void> {
  const p = new Deno.Command(cmd[0], { args: cmd.slice(1), stdout: "inherit", stderr: "inherit" });
  const { code } = await p.output();
  if (code !== 0) throw new Error(`${cmd.join(" ")} exited with ${code}`);
}

async function captureStdout(cmd: string[]): Promise<string> {
  const p = new Deno.Command(cmd[0], { args: cmd.slice(1) });
  const { stdout } = await p.output();
  return new TextDecoder().decode(stdout).trim();
}

const arg = Deno.args[0] ?? "patch";

const pkg = await readJson(FILES.pkg);
const current = pkg.version as string;
const next = ["patch", "minor", "major"].includes(arg)
  ? bump(current, arg as "patch" | "minor" | "major")
  : arg;

if (!/^\d+\.\d+\.\d+$/.test(next)) {
  console.error(`invalid version: ${next}`);
  Deno.exit(1);
}

const status = await captureStdout(["git", "status", "--porcelain"]);
if (status) {
  console.error("working tree has uncommitted changes — commit or stash first:");
  console.error(status);
  Deno.exit(1);
}

console.log(`bumping ${current} → ${next}`);

pkg.version = next;
await writeJson(FILES.pkg, pkg);

const tauri = await readJson(FILES.tauri);
tauri.version = next;
await writeJson(FILES.tauri, tauri);

await patchCargo(FILES.cargo, next);

const branch = await captureStdout(["git", "rev-parse", "--abbrev-ref", "HEAD"]);
const tag = `v${next}`;

await run(["git", "add", FILES.pkg, FILES.tauri, FILES.cargo]);
await run(["git", "commit", "-m", `chore: release ${tag}`]);
await run(["git", "tag", tag]);
await run(["git", "push", "origin", branch, tag]);

console.log(`released ${tag} from ${branch} — GitHub Action will build and publish.`);
