import { STORAGE_KEYS } from "../../platform/storageKeys.ts";
import { createEffect, createRoot, createSignal } from "solid-js";
import { playNotificationSound } from "../../kit/notificationSound.ts";
import { markSeen } from "../feed/index.ts";
import { countUnread, fresh, msUntilNextExpiry } from "./model.ts";
import { upgradeMention } from "./upgrade.ts";
import { notificationsMentionSound } from "../preferences/index.ts";
import { selectedChannel } from "../navigation/index.ts";
import type { Mention } from "./types.ts";
import * as storage from "../../platform/storage.ts";

const [mentions, setMentions] = createSignal<Mention[]>([]);
export { mentions };

export const unreadCount = () => countUnread(mentions());
export const unreadCountIn = (broadcasterId: string) =>
  countUnread(mentions(), broadcasterId);

const MAX = 100;
const SAVE_DELAY_MS = 1000;

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let unsaved: Mention[] | undefined;

export function start(): () => void {
  setMentions(load());
  let timer: ReturnType<typeof setTimeout> | undefined;
  const dispose = createRoot((dispose) => {
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

function load(): Mention[] {
  const stored = storage.read(STORAGE_KEYS.mentions);
  if (!Array.isArray(stored)) return [];
  const upgraded = stored.map(upgradeMention).filter((m) => m !== null);
  return fresh(upgraded, Date.now());
}

export function flush() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (!unsaved) return;
  storage.write(STORAGE_KEYS.mentions, unsaved);
  unsaved = undefined;
}

function save(list: Mention[]) {
  unsaved = list;
  saveTimer ??= setTimeout(flush, SAVE_DELAY_MS);
  return list;
}

export function record(m: Omit<Mention, "unread">) {
  const prev = mentions();
  if (prev.some((x) => x.id === m.id)) return;
  const isActive = selectedChannel()?.id === m.broadcasterId;
  const next = [{ ...m, unread: !isActive }, ...fresh(prev, Date.now())];
  setMentions(save(next.length > MAX ? next.slice(0, MAX) : next));
  if (notificationsMentionSound()) playNotificationSound();
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
