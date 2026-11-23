import type { User } from "../../lib/types/index.ts";

export type KnownUser = { user: User; fetchedAt: number | null };

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

export function sameUser(a: User, b: User): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<
    keyof User
  >;
  return [...keys].every((k) => a[k] === b[k]);
}

export function changedEntries(
  table: Record<string, KnownUser>,
  users: User[],
  fetchedAt: number | null,
): Map<string, KnownUser> {
  const pending = new Map<string, KnownUser>();
  for (const next of users) {
    const prev = pending.get(next.id) ?? table[next.id];
    const merged = mergeUser(prev?.user, next, fetchedAt !== null);
    const at = fetchedAt ?? prev?.fetchedAt ?? null;
    const same = prev !== undefined && sameUser(prev.user, merged);
    if (same && prev.fetchedAt === at) continue;
    pending.set(next.id, { user: same ? prev.user : merged, fetchedAt: at });
  }
  return pending;
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
