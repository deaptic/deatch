import type { User } from "../../shared/types/index.ts";

export type QuickSwitchRow<A> =
  | { kind: "channel"; user: User }
  | { kind: "action"; action: A }
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

export function matchesWords(text: string, query: string): boolean {
  const haystack = text.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function quickSwitchRows<A extends { label: string }>(
  candidates: User[],
  actions: A[],
  query: string,
): QuickSwitchRow<A>[] {
  const q = query.trim().toLowerCase();
  const list = candidates.filter((u) => !q || matches(u, q));
  const rows: QuickSwitchRow<A>[] = list.map((user) => ({
    kind: "channel",
    user,
  }));
  if (!q) return rows;
  for (const action of actions) {
    if (matchesWords(action.label, q)) rows.push({ kind: "action", action });
  }
  if (!list.some((u) => u.login === q)) {
    rows.push({ kind: "search", query: q });
  }
  return rows;
}
