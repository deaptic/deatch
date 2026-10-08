type Kind = "patch" | "minor" | "major";

function bump(current: string, kind: Kind): string {
  const [maj, min, pat] = current.split(".").map((n) => parseInt(n, 10));
  if ([maj, min, pat].some(Number.isNaN)) {
    throw new Error(`unparseable current version: ${current}`);
  }
  if (kind === "major") return `${maj + 1}.0.0`;
  if (kind === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

/// `arg` is a bump kind or an explicit version; exits on anything else.
export function nextVersion(current: string, arg = "patch"): string {
  const next = ["patch", "minor", "major"].includes(arg)
    ? bump(current, arg as Kind)
    : arg;
  if (!/^\d+\.\d+\.\d+$/.test(next)) {
    console.error(`invalid version: ${next}`);
    Deno.exit(1);
  }
  return next;
}
