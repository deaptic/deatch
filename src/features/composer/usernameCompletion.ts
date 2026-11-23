import type { Chatter } from "../../lib/types/index.ts";

type Named = Pick<Chatter, "login" | "displayName" | "lastSeen">;

function mentionName(c: Pick<Named, "login" | "displayName">) {
  return c.displayName.toLowerCase() === c.login ? c.displayName : c.login;
}

export function completions(chatters: Iterable<Named>, query: string) {
  const q = query.toLowerCase();
  return [...chatters]
    .filter(
      (c) =>
        c.login.toLowerCase().startsWith(q) ||
        c.displayName.toLowerCase().startsWith(q),
    )
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .map(mentionName);
}
