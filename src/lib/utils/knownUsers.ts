import type { User } from "../types/index.ts";

export type KnownUser = { user: User; at: number };

const USER_ID = /^\d+$/;

export function isUserId(id: string): boolean {
  return USER_ID.test(id);
}

export function mergeUser(prev: User | undefined, next: User): User {
  if (!prev || isComplete(next)) return next;
  const merged = { ...prev };
  for (const key of Object.keys(next) as (keyof User)[]) {
    if (!merged[key] && next[key]) {
      (merged as Record<keyof User, unknown>)[key] = next[key];
    }
  }
  return {
    ...merged,
    login: next.login || prev.login,
    displayName: next.displayName || prev.displayName,
  };
}

// Keys come from both sides so a cached user from an older shape still differs.
export function sameUser(a: User, b: User): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<
    keyof User
  >;
  return [...keys].every((k) => a[k] === b[k]);
}

export function isComplete(user: User): boolean {
  return user.createdAt !== "";
}

export function isKnownUser(value: unknown): value is KnownUser {
  const e = value as Partial<KnownUser> | null;
  return typeof e?.at === "number" && typeof e.user?.id === "string" &&
    typeof e.user.login === "string";
}

export function freshEntries(
  entries: Record<string, KnownUser>,
  now: number,
  ttlMs: number,
  max: number,
  keep: ReadonlySet<string> = new Set(),
): Record<string, KnownUser> {
  const fresh = Object.entries(entries)
    .filter(([id, e]) => keep.has(id) || now - e.at < ttlMs)
    .sort(([a, x], [b, y]) =>
      Number(keep.has(b)) - Number(keep.has(a)) || y.at - x.at
    )
    .slice(0, max);
  return Object.fromEntries(fresh);
}
