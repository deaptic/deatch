const KINDS = ["patch", "minor", "major"] as const;
type Kind = (typeof KINDS)[number];

type Version = { major: number; minor: number; patch: number };

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function parse(version: string): Version | null {
  const match = SEMVER.exec(version);
  if (!match) return null;
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

function isKind(arg: string): arg is Kind {
  return (KINDS as readonly string[]).includes(arg);
}

function bump({ major, minor, patch }: Version, kind: Kind): string {
  if (kind === "major") return `${major + 1}.0.0`;
  if (kind === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/// `arg` is a bump kind or an explicit version; throws on anything else.
export function nextVersion(current: string, arg = "patch"): string {
  if (!isKind(arg)) {
    if (!parse(arg)) throw new Error(`invalid version: ${arg}`);
    return arg;
  }
  const version = parse(current);
  if (!version) throw new Error(`unparseable current version: ${current}`);
  return bump(version, arg);
}
