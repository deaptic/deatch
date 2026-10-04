import { fetchUsers } from "../api/twitch/users.ts";
import type { InvokeOptions } from "../api/utils.ts";
import { knownUser, knownUsers, setKnownUsers } from "../stores/users.ts";
import type { GetUsersParams, User } from "../types/index.ts";
import {
  freshEntries,
  isComplete,
  type KnownUser,
  mergeUser,
  requestsInWindow,
} from "../utils/knownUsers.ts";

const CACHE_KEY = "cache:users";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_KNOWN = 5000;
const SAVE_DELAY_MS = 2000;
const LOOKUP_DELAY_MS = 1000;
const LOOKUP_BATCH = 100;
const MAX_LOOKUPS_PER_MINUTE = 20;
const MINUTE_MS = 60_000;

const inFlight = new Map<string, Promise<void>>();
const queued = new Set<string>();
const notFound = new Set<string>();
let lookupsSentAt: number[] = [];
let lookupTimer: ReturnType<typeof setTimeout> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

export function start(): () => void {
  const saved = freshEntries(load(), Date.now(), TTL_MS, MAX_KNOWN);
  setKnownUsers((prev) => ({ ...saved, ...prev }));
  return () => {
    clearTimeout(lookupTimer);
    lookupTimer = undefined;
    queued.clear();
    clearTimeout(saveTimer);
    save();
  };
}

export function remember(users: User[]): void {
  if (users.length === 0) return;
  const at = Date.now();
  setKnownUsers((prev) => {
    const next = { ...prev };
    for (const u of users) {
      next[u.id] = { user: mergeUser(prev[u.id]?.user, u), at };
    }
    return Object.keys(next).length > MAX_KNOWN
      ? freshEntries(next, at, TTL_MS, MAX_KNOWN)
      : next;
  });
  scheduleSave();
}

export async function get(
  params: GetUsersParams = {},
  options?: InvokeOptions,
): Promise<User[]> {
  const ids = params.ids ?? [];
  const logins = params.logins ?? [];
  if (ids.length && logins.length === 0) return getById(ids, options);
  return refresh(params, options);
}

export async function refresh(
  params: GetUsersParams,
  options?: InvokeOptions,
): Promise<User[]> {
  const users = await fetchUsers(params, options);
  remember(users);
  return users;
}

export function request(id: string): void {
  const known = knownUser(id);
  if (
    (known && isComplete(known)) || notFound.has(id) || queued.has(id) ||
    inFlight.has(id)
  ) {
    return;
  }
  queued.add(id);
  scheduleLookup(LOOKUP_DELAY_MS);
}

async function getById(
  ids: string[],
  options?: InvokeOptions,
): Promise<User[]> {
  const missing = ids.filter((id) => {
    const known = knownUser(id);
    return !(known && isComplete(known)) && !inFlight.has(id);
  });
  if (missing.length) track(missing, refresh({ ids: missing }, options));
  await Promise.allSettled(
    ids.map((id) => inFlight.get(id)).filter((p) => p !== undefined),
  );
  return ids.map(knownUser).filter((u): u is User => !!u);
}

function track(ids: string[], request: Promise<unknown>) {
  const settled = request.then(() => {}).finally(() => {
    for (const id of ids) inFlight.delete(id);
  });
  for (const id of ids) inFlight.set(id, settled);
}

function scheduleLookup(delayMs: number) {
  if (lookupTimer === undefined) lookupTimer = setTimeout(lookup, delayMs);
}

function lookup() {
  lookupTimer = undefined;
  const now = Date.now();
  lookupsSentAt = requestsInWindow(lookupsSentAt, now, MINUTE_MS);
  if (lookupsSentAt.length >= MAX_LOOKUPS_PER_MINUTE) {
    scheduleLookup(MINUTE_MS - (now - lookupsSentAt[0]));
    return;
  }
  const ids = [...queued].slice(0, LOOKUP_BATCH);
  if (ids.length === 0) return;
  for (const id of ids) queued.delete(id);
  lookupsSentAt.push(now);
  if (queued.size > 0) scheduleLookup(LOOKUP_DELAY_MS);
  const request = refresh({ ids }, { silent: true }).then((users) => {
    const found = new Set(users.map((u) => u.id));
    for (const id of ids) if (!found.has(id)) notFound.add(id);
  });
  track(ids, request);
  request.catch((e) => console.warn("user lookup failed", e));
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, SAVE_DELAY_MS);
}

function load(): Record<string, KnownUser> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) as Record<string, KnownUser> : {};
  } catch {
    return {};
  }
}

function save() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(knownUsers()));
  } catch (e) {
    console.warn("user cache not saved", e);
  }
}
