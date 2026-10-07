import { untrack } from "solid-js";
import { produce, reconcile, unwrap } from "solid-js/store";
import { fetchUsers } from "../api/twitch/users.ts";
import type { InvokeOptions } from "../api/utils.ts";
import { pinnedChannels } from "../stores/preferences.ts";
import {
  knownUser,
  knownUsers,
  setKnownUsers,
  user as self,
} from "../stores/users.ts";
import type { GetUsersParams, User } from "../types/index.ts";
import {
  freshEntries,
  isComplete,
  isKnownUser,
  isUserId,
  type KnownUser,
  mergeUser,
  sameUser,
} from "../utils/knownUsers.ts";

const CACHE_KEY = "cache:users";
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_KNOWN = 2000;
const SAVE_DELAY_MS = 2000;
const SAVE_MAX_WAIT_MS = 10_000;
const BATCH_DELAY_MS = 250;

type Waiter = { resolve: () => void; reject: (error: unknown) => void };

const waiting = new Map<string, Promise<void>>();
const waiters = new Map<string, Waiter[]>();
const queued = new Set<string>();
const notFound = new Set<string>();
let batchTimer: ReturnType<typeof setTimeout> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saveDeadline = 0;
let dirty = false;

export function start(): () => void {
  const saved = freshEntries(load(), Date.now(), TTL_MS, MAX_KNOWN);
  setKnownUsers(produce((table) => {
    for (const [id, entry] of Object.entries(saved)) table[id] ??= entry;
  }));
  globalThis.addEventListener("pagehide", save);
  return () => {
    globalThis.removeEventListener("pagehide", save);
    clearTimeout(batchTimer);
    batchTimer = undefined;
    queued.clear();
    save();
  };
}

/// `at` is when Twitch last returned the user; partial users from stream
/// data refresh names but never count as a fetch.
export function set(users: User[]): void {
  if (users.length === 0) return;
  const now = Date.now();
  setKnownUsers(produce((table) => {
    for (const next of users) {
      const prev = table[next.id];
      const merged = mergeUser(prev?.user, next);
      const at = isComplete(next) ? now : prev?.at ?? 0;
      if (prev && sameUser(prev.user, merged)) prev.at = at;
      else table[next.id] = { user: merged, at };
    }
  }));
  if (Object.keys(unwrap(knownUsers)).length > MAX_KNOWN) evict(now);
  scheduleSave();
}

export async function fetch(
  params: GetUsersParams,
  options?: InvokeOptions,
): Promise<User[]> {
  const users = await fetchUsers(params, options);
  set(users);
  return users;
}

export function get(ids: string[]): Promise<User[]> {
  return untrack(() => {
    const wanted = ids.filter(isUserId);
    const pending = wanted
      .filter((id) => !isKnown(id) && !notFound.has(id))
      .map(enqueue);
    return Promise.all(pending).then(() =>
      wanted.map(knownUser).filter((u): u is User => !!u)
    );
  });
}

function isKnown(id: string): boolean {
  const entry = knownUsers[id];
  return !!entry && isComplete(entry.user) && Date.now() - entry.at < TTL_MS;
}

function enqueue(id: string): Promise<void> {
  const existing = waiting.get(id);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    waiters.set(id, [...(waiters.get(id) ?? []), { resolve, reject }]);
  });
  waiting.set(id, promise);
  queued.add(id);
  batchTimer ??= setTimeout(sendBatch, BATCH_DELAY_MS);
  return promise;
}

/// Pacing against Twitch's rate limit lives in the backend transport, so
/// each batch goes out whole; the backend splits it into 100-id requests.
async function sendBatch() {
  batchTimer = undefined;
  const ids = [...queued].filter((id) => !isKnown(id));
  for (const id of queued) if (isKnown(id)) settle(id);
  queued.clear();
  if (ids.length === 0) return;
  try {
    const found = new Set(
      (await fetch({ ids }, { silent: true })).map((u) => u.id),
    );
    for (const id of ids) {
      if (!found.has(id)) notFound.add(id);
      settle(id);
    }
  } catch (error) {
    for (const id of ids) settle(id, error);
  }
}

function settle(id: string, error?: unknown) {
  queued.delete(id);
  waiting.delete(id);
  const list = waiters.get(id) ?? [];
  waiters.delete(id);
  for (const w of list) error === undefined ? w.resolve() : w.reject(error);
}

function evict(now: number) {
  const keep = new Set(pinnedChannels());
  const me = self();
  if (me) keep.add(me.id);
  setKnownUsers(
    reconcile(freshEntries(unwrap(knownUsers), now, TTL_MS, MAX_KNOWN, keep)),
  );
}

function scheduleSave() {
  const now = Date.now();
  if (!dirty) saveDeadline = now + SAVE_MAX_WAIT_MS;
  dirty = true;
  clearTimeout(saveTimer);
  const delay = Math.min(SAVE_DELAY_MS, Math.max(0, saveDeadline - now));
  saveTimer = setTimeout(save, delay);
}

function load(): Record<string, KnownUser> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {};
    return Object.fromEntries(
      Object.entries(parsed).filter((e): e is [string, KnownUser] =>
        isKnownUser(e[1])
      ),
    );
  } catch {
    return {};
  }
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (!dirty) return;
  dirty = false;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(unwrap(knownUsers)));
  } catch (e) {
    console.warn("user cache not saved", e);
  }
}
