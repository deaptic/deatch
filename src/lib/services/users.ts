import { STORAGE_KEYS } from "../constants/storage.ts";
import { untrack } from "solid-js";
import { produce, reconcile, unwrap } from "solid-js/store";
import { getUsers } from "../api/twitch/users.ts";
import type { InvokeOptions } from "../api/utils.ts";
import { pinnedChannels } from "../stores/preferences.ts";
import {
  knownUser,
  knownUsers,
  setKnownUsers,
  user as self,
} from "../stores/users.ts";
import type { GetUsersParams, User, UserRef } from "../types/index.ts";
import * as storage from "../utils/storage.ts";
import { addToast } from "../stores/toasts.ts";
import {
  freshEntries,
  isKnownUser,
  isUserId,
  type KnownUser,
  mergeUser,
  sameUser,
  userFromRef,
} from "../utils/knownUsers.ts";

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_KNOWN = 2000;
const SAVE_DELAY_MS = 2000;
const SAVE_MAX_WAIT_MS = 10_000;
const BATCH_DELAY_MS = 250;

type Waiter = { resolve: () => void; reject: (error: unknown) => void };

const waiting = new Map<string, Promise<void>>();
const waiters = new Map<string, Waiter[]>();
const queued = new Set<string>();
// Id → when Twitch last returned nothing for it; retried after TTL_MS so a
// new or briefly suspended account resolves eventually.
const notFound = new Map<string, number>();
let batchTimer: ReturnType<typeof setTimeout> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saveDeadline = 0;
let dirty = false;

export function start(): () => void {
  const saved = freshEntries(load(), Date.now(), TTL_MS, MAX_KNOWN);
  setKnownUsers(
    produce((table) => {
      for (const [id, entry] of Object.entries(saved)) table[id] ??= entry;
    }),
  );
  return () => {
    clearTimeout(batchTimer);
    batchTimer = undefined;
    for (const id of waiters.keys()) settle(id, new Error("stopped"));
    flush();
  };
}

/// Whole users as Twitch returned them; each counts as fetched now.
export function set(users: User[]): void {
  apply(users, Date.now());
}

/// What a stream, a chat message or a search result says about users: it
/// renames them and fills gaps, but never counts as a fetch.
export function note(partials: (UserRef & Partial<User>)[]): void {
  apply(
    partials.map((p) => ({ ...userFromRef(p), ...p })),
    null,
  );
}

function apply(users: User[], fetchedAt: number | null) {
  const now = Date.now();
  const pending = changedEntries(unwrap(knownUsers), users, fetchedAt);
  if (pending.size === 0) return;
  setKnownUsers(
    produce((table) => {
      for (const [id, entry] of pending) table[id] = entry;
    }),
  );
  if (Object.keys(unwrap(knownUsers)).length > MAX_KNOWN) evict(now);
  scheduleSave();
}

/// The entries `users` change, applied in order so a later duplicate builds
/// on an earlier one. An unchanged user keeps its object, so only
/// `fetchedAt` moves.
function changedEntries(
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

export async function fetch(
  params: GetUsersParams,
  options?: InvokeOptions,
): Promise<User[]> {
  const users = await getUsers(params, options);
  set(users);
  return users;
}

/// A failed request is already reported by invokeCommand; callers only branch.
type Lookup =
  | { status: "found"; user: User }
  | { status: "missing" }
  | { status: "failed" };

/// The user with that login, or null once the user has been told why not:
/// a missing login toasts `notFound`, a failed request was already reported.
export async function lookUp(
  login: string,
  notFound: string,
): Promise<User | null> {
  const lookup = await findByLogin(login);
  if (lookup.status === "missing") addToast(notFound, "error");
  return lookup.status === "found" ? lookup.user : null;
}

/// The full reference for a partly known user, looked up by id or else by
/// login; null when neither finds one.
export async function resolve(
  identity: Partial<UserRef>,
): Promise<UserRef | null> {
  const { id, login, displayName } = identity;
  if (id && login && displayName) return { id, login, displayName };
  if (id) {
    const [user] = await get([id]).catch(() => []);
    return user ? toUserRef(user) : null;
  }
  if (!login) return null;
  const lookup = await findByLogin(login);
  return lookup.status === "found" ? toUserRef(lookup.user) : null;
}

export async function resolveId(
  identity: Partial<UserRef>,
): Promise<string | null> {
  return identity.id ?? (await resolve(identity))?.id ?? null;
}

function toUserRef({ id, login, displayName }: User): UserRef {
  return { id, login, displayName };
}

export async function findByLogin(
  login: string,
  options?: InvokeOptions,
): Promise<Lookup> {
  try {
    const [user] = await fetch({ logins: [login] }, options);
    return user ? { status: "found", user } : { status: "missing" };
  } catch {
    return { status: "failed" };
  }
}

export function get(ids: string[]): Promise<User[]> {
  return untrack(() => {
    const wanted = ids.filter(isUserId);
    const pending = wanted
      .filter((id) => !isKnown(id) && !recentlyMissing(id))
      .map(enqueue);
    return Promise.all(pending).then(() =>
      wanted.map(knownUser).filter((u): u is User => !!u),
    );
  });
}

function recentlyMissing(id: string): boolean {
  const at = notFound.get(id);
  if (at === undefined) return false;
  if (Date.now() - at < TTL_MS) return true;
  notFound.delete(id);
  return false;
}

function isKnown(id: string): boolean {
  const fetchedAt = knownUsers[id]?.fetchedAt;
  if (fetchedAt === undefined || fetchedAt === null) return false;
  return Date.now() - fetchedAt < TTL_MS;
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
    const now = Date.now();
    for (const id of ids) {
      if (found.has(id)) notFound.delete(id);
      else notFound.set(id, now);
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
  for (const w of list) {
    if (error === undefined) w.resolve();
    else w.reject(error);
  }
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
  saveTimer = setTimeout(flush, delay);
}

function load(): Record<string, KnownUser> {
  const stored = storage.read(STORAGE_KEYS.users);
  if (typeof stored !== "object" || stored === null) return {};
  return Object.fromEntries(
    Object.entries(stored).filter((e): e is [string, KnownUser] =>
      isKnownUser(e[1]),
    ),
  );
}

export function flush() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (!dirty) return;
  dirty = false;
  storage.write(STORAGE_KEYS.users, unwrap(knownUsers));
}
