import { fetchUsers } from "../api/twitch/users.ts";
import { avatarFor, setAvatars } from "../stores/avatars.ts";
import { cacheUsers, userCache } from "../stores/users.ts";
import {
  type CachedAvatar,
  freshEntries,
  requestsInWindow,
} from "../utils/avatar.ts";

const CACHE_KEY = "cache:avatars";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHED = 5000;
const FLUSH_MS = 1000;
const BATCH_SIZE = 100;
const MAX_REQUESTS_PER_MINUTE = 20;
const MINUTE_MS = 60_000;

let cached: Record<string, CachedAvatar> = {};
const queued = new Set<string>();
const inFlight = new Set<string>();
let sentAt: number[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;

export function start(): () => void {
  cached = freshEntries(load(), Date.now(), TTL_MS, MAX_CACHED);
  setAvatars(
    Object.fromEntries(Object.entries(cached).map(([id, e]) => [id, e.url])),
  );
  return () => {
    clearTimeout(timer);
    timer = undefined;
    queued.clear();
  };
}

export function request(userId: string): void {
  if (
    avatarFor(userId) !== undefined || queued.has(userId) ||
    inFlight.has(userId)
  ) {
    return;
  }
  const known = userCache()[userId];
  if (known) {
    remember({ [userId]: known.profileImageUrl });
    return;
  }
  queued.add(userId);
  schedule(FLUSH_MS);
}

function schedule(delayMs: number) {
  if (timer === undefined) timer = setTimeout(flush, delayMs);
}

async function flush() {
  timer = undefined;
  const now = Date.now();
  sentAt = requestsInWindow(sentAt, now, MINUTE_MS);
  if (sentAt.length >= MAX_REQUESTS_PER_MINUTE) {
    schedule(MINUTE_MS - (now - sentAt[0]));
    return;
  }
  const ids = [...queued].slice(0, BATCH_SIZE);
  if (ids.length === 0) return;
  for (const id of ids) {
    queued.delete(id);
    inFlight.add(id);
  }
  sentAt.push(now);
  if (queued.size > 0) schedule(FLUSH_MS);
  try {
    const users = await fetchUsers({ ids }, { silent: true });
    cacheUsers(users);
    const found = new Map(users.map((u) => [u.id, u.profileImageUrl]));
    remember(Object.fromEntries(ids.map((id) => [id, found.get(id) ?? ""])));
  } catch (e) {
    console.warn("avatar lookup failed", e);
  } finally {
    for (const id of ids) inFlight.delete(id);
  }
}

function remember(avatars: Record<string, string>) {
  setAvatars(avatars);
  const at = Date.now();
  for (const [id, url] of Object.entries(avatars)) cached[id] = { url, at };
  cached = freshEntries(cached, at, TTL_MS, MAX_CACHED);
  save();
}

function load(): Record<string, CachedAvatar> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) as Record<string, CachedAvatar> : {};
  } catch {
    return {};
  }
}

function save() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (e) {
    console.warn("avatar cache not saved", e);
  }
}
