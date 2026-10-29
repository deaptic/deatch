import type { User } from "../types/index.ts";

export type QuickSwitchRow =
  | { kind: "channel"; user: User }
  | { kind: "search"; query: string };

export function uniqueUsers(users: (User | null | undefined)[]): User[] {
  const seen = new Set<string>();
  return users.filter((u): u is User => {
    if (!u || seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
}

function matches(u: User, q: string): boolean {
  return u.login.includes(q) || u.displayName.toLowerCase().includes(q);
}

export function quickSwitchRows(
  candidates: User[],
  query: string,
): QuickSwitchRow[] {
  const q = query.trim().toLowerCase();
  const list = candidates.filter((u) => !q || matches(u, q));
  const rows: QuickSwitchRow[] = list.map((user) => ({
    kind: "channel",
    user,
  }));
  if (q && !list.some((u) => u.login === q)) {
    rows.push({ kind: "search", query: q });
  }
  return rows;
}
