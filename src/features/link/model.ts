import type { LinkState, User } from "../../lib/types/index.ts";

export type Plan = {
  muted: Record<string, boolean>;
  keep: User[];
  fetch: Set<string>;
  lookUp: string | null;
  unlink: boolean;
};

export function planState(
  { channels, current }: Pick<LinkState, "channels" | "current">,
  open: User[],
  linkedLogin: string | null,
): Plan {
  const muted: Record<string, boolean> = {};
  for (const c of channels) muted[c.login.toLowerCase()] = c.muted ?? false;

  const incoming = new Set(channels.map((c) => c.login.toLowerCase()));
  const keep = open.filter((c) => incoming.has(c.login));
  const known = new Set(keep.map((c) => c.login));
  const fetch = new Set([...incoming].filter((l) => !known.has(l)));

  const cur = current?.toLowerCase() ?? null;
  return {
    muted,
    keep,
    fetch,
    lookUp: cur && linkedLogin !== cur ? cur : null,
    unlink: !cur && linkedLogin !== null,
  };
}
