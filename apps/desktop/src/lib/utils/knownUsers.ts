import type { User } from "../types/index.ts";

export type KnownUser = { user: User; at: number };

const USER_ID = /^\d+$/;

export function isUserId(id: string): boolean {
  return USER_ID.test(id);
}

export function mergeUser(prev: User | undefined, next: User): User {
  if (!prev || isComplete(next)) return next;
  const merged: Record<keyof User, string> = { ...prev };
  for (const [key, value] of Object.entries(next) as [keyof User, string][]) {
    if (!merged[key] && value) merged[key] = value;
  }
  return {
    ...(merged as User),
    login: next.login || prev.login,
    displayName: next.displayName || prev.displayName,
  };
}

export function sameUser(a: User, b: User): boolean {
  return (Object.keys(a) as (keyof User)[]).every((k) => a[k] === b[k]);
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
