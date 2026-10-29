import type { LinkState, User } from "../types/index.ts";

export type LinkPlan = {
  muted: Record<string, boolean>;
  keep: User[];
  fetch: Set<string>;
  lookUp: string | null;
  unlink: boolean;
};

export function planLinkState(
  { channels, current }: Pick<LinkState, "channels" | "current">,
  warmed: User[],
  linkedLogin: string | null,
): LinkPlan {
  const muted: Record<string, boolean> = {};
  for (const c of channels) muted[c.login.toLowerCase()] = c.muted ?? false;

  const incoming = new Set(channels.map((c) => c.login.toLowerCase()));
  const keep = warmed.filter((c) => incoming.has(c.login));
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
