import type { User } from "../types/index.ts";

export type KnownUser = { user: User; at: number };

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

export function isComplete(user: User): boolean {
  return user.createdAt !== "";
}

export function freshEntries(
  entries: Record<string, KnownUser>,
  now: number,
  ttlMs: number,
  max: number,
): Record<string, KnownUser> {
  const fresh = Object.entries(entries)
    .filter(([, e]) => now - e.at < ttlMs)
    .sort(([, a], [, b]) => b.at - a.at)
    .slice(0, max);
  return Object.fromEntries(fresh);
}

export function requestsInWindow(
  sentAt: readonly number[],
  now: number,
  windowMs: number,
): number[] {
  return sentAt.filter((t) => now - t < windowMs);
}
