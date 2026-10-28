import type { User } from "../types/index.ts";

/// `fetchedAt` is when Twitch last returned the whole user; null while only
/// partial data (names from streams, chat or search) has been seen.
export type KnownUser = { user: User; fetchedAt: number | null };

const USER_ID = /^\d+$/;

export function isUserId(id: string): boolean {
  return USER_ID.test(id);
}

/// A whole user from Twitch replaces the cached one; a partial one only
/// renames it and fills the fields it lacks.
export function mergeUser(
  prev: User | undefined,
  next: User,
  whole: boolean,
): User {
  if (!prev || whole) return next;
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

export function isKnownUser(value: unknown): value is KnownUser {
  const e = value as Partial<KnownUser> | null;
  return (
    (typeof e?.fetchedAt === "number" || e?.fetchedAt === null) &&
    typeof e.user?.id === "string" &&
    typeof e.user.login === "string"
  );
}

export function freshEntries(
  entries: Record<string, KnownUser>,
  now: number,
  ttlMs: number,
  max: number,
  keep: ReadonlySet<string> = new Set(),
): Record<string, KnownUser> {
  // Never fetched counts as expired: only kept ids hold on to partial data.
  const age = (e: KnownUser) =>
    e.fetchedAt === null ? Infinity : now - e.fetchedAt;
  const fresh = Object.entries(entries)
    .filter(([id, e]) => keep.has(id) || age(e) < ttlMs)
    .sort(
      ([a, x], [b, y]) =>
        Number(keep.has(b)) - Number(keep.has(a)) || age(x) - age(y),
    )
    .slice(0, max);
  return Object.fromEntries(fresh);
}
