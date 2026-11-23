import { createSignal } from "solid-js";
import type { UserRef } from "../types/index.ts";

const [blocked, setBlocked] = createSignal<UserRef[]>([]);
const [blockedIds, setBlockedIds] = createSignal<ReadonlySet<string>>(
  new Set(),
);

export const blockedUsers = blocked;

export function isBlocked(userId: string): boolean {
  return blockedIds().has(userId);
}

export function setBlockedUsers(users: UserRef[]) {
  setBlocked(users);
  setBlockedIds(new Set(users.map((u) => u.id)));
}
