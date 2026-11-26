import { mentionsKey, type StorageKey } from "../../../platform/storageKeys.ts";
import { createEffect, createRoot, createSignal, on } from "solid-js";
import { playNotificationSound } from "../../../platform/notifications.ts";
import { markSeen } from "../../feed/index.ts";
import { countUnread, fresh, msUntilNextExpiry } from "./model.ts";
import { upgradeMention } from "./upgrade.ts";
import {
  notificationsMentionSound,
  streamerMode,
} from "../../preferences/index.ts";
import { selectedChannel } from "../../navigation/index.ts";
import { user } from "../../users/index.ts";
import type { Mention } from "./types.ts";
import * as storage from "../../../platform/storage.ts";

const [mentions, setMentions] = createSignal<Mention[]>([]);
export { mentions };

export const unreadCount = () => countUnread(mentions());
export const unreadCountIn = (broadcasterId: string) =>
  countUnread(mentions(), broadcasterId);

const MAX = 100;
const SAVE_DELAY_MS = 1000;

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let unsaved: { key: StorageKey; list: Mention[] } | undefined;
let key: StorageKey | null = null;

export function start(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const dispose = createRoot((dispose) => {
    createEffect(
      on(
        () => user()?.id,
        (userId) => {
          flush();
          key = userId ? mentionsKey(userId) : null;
          setMentions(key ? load(key) : []);
        },
      ),
    );
    createEffect(() => {
      clearTimeout(timer);
      const delay = msUntilNextExpiry(mentions(), Date.now());
      if (delay !== null) timer = setTimeout(pruneExpired, delay);
    });
    return dispose;
  });
  return () => {
    dispose();
    clearTimeout(timer);
    flush();
  };
}

function load(from: StorageKey): Mention[] {
  const stored = storage.read(from);
  if (!Array.isArray(stored)) return [];
  const upgraded = stored.map(upgradeMention).filter((m) => m !== null);
  return fresh(upgraded, Date.now());
}

export function flush() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (!unsaved) return;
  storage.write(unsaved.key, unsaved.list);
  unsaved = undefined;
}

function save(list: Mention[]) {
  if (!key) return list;
  unsaved = { key, list };
  saveTimer ??= setTimeout(flush, SAVE_DELAY_MS);
  return list;
}

export function record(m: Omit<Mention, "unread">) {
  const prev = mentions();
  if (prev.some((x) => x.id === m.id)) return;
  const isActive = selectedChannel()?.id === m.broadcasterId;
  const next = [{ ...m, unread: !isActive }, ...fresh(prev, Date.now())];
  setMentions(save(next.length > MAX ? next.slice(0, MAX) : next));
  if (notificationsMentionSound() && !streamerMode()) playNotificationSound();
}

function pruneExpired() {
  setMentions((prev) => {
    const next = fresh(prev, Date.now());
    return next.length === prev.length ? prev : save(next);
  });
}

function markReadWhere(match: (m: Mention) => boolean) {
  const prev = mentions();
  const unread = (m: Mention) => m.unread && match(m);
  if (!prev.some(unread)) return;
  setMentions(save(prev.map((m) => (unread(m) ? { ...m, unread: false } : m))));
}

export const markRead = (id: string) => markReadWhere((m) => m.id === id);
export function markChannelSeen(broadcasterId: string): void {
  markSeen(broadcasterId);
  markReadWhere((m) => m.broadcasterId === broadcasterId);
}

export function dismiss(id: string) {
  setMentions((prev) => {
    const next = prev.filter((m) => m.id !== id);
    return next.length === prev.length ? prev : save(next);
  });
}

export const dismissAll = () => setMentions(save([]));
