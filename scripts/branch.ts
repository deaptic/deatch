const RELEASE_BRANCH = "main";

export type Sync = { ahead: number; behind: number };

export function parseSync(revListCount: string): Sync {
  const match = /^(\d+)\s+(\d+)$/.exec(revListCount.trim());
  if (!match) throw new Error(`unexpected rev-list output: ${revListCount}`);
  return { ahead: Number(match[1]), behind: Number(match[2]) };
}

export function branchBlocker(name: string): string | null {
  if (name === "HEAD") {
    return `HEAD is detached — check out ${RELEASE_BRANCH} to release`;
  }
  if (name !== RELEASE_BRANCH) {
    return `on ${name} — releases are cut from ${RELEASE_BRANCH}`;
  }
  return null;
}

export function syncBlocker(
  name: string,
  { ahead, behind }: Sync,
): string | null {
  if (behind > 0) {
    return `${name} is ${behind} commit(s) behind its upstream — pull first`;
  }
  if (ahead > 0) {
    return `${name} is ${ahead} commit(s) ahead of its upstream — push first`;
  }
  return null;
}
