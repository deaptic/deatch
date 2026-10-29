import { STORAGE_KEYS } from "../constants/storage.ts";
import { createEffect } from "solid-js";
import notificationSound from "../../assets/notification.mp3";
import { mentions, setMentions } from "../stores/inbox.ts";
import { fresh, msUntilNextExpiry } from "../utils/inboxRetention.ts";
import { upgradeMention } from "../utils/inboxUpgrade.ts";
import { notificationsMentionSound } from "../stores/preferences.ts";
import { selectedChannel } from "../stores/view.ts";
import type { Mention } from "../types/index.ts";
import * as storage from "../utils/storage.ts";

const MAX = 100;
const SAVE_DELAY_MS = 1000;

let sound: HTMLAudioElement | null = null;
let saveTimer: number | undefined;
let unsaved: Mention[] | undefined;

export function start(): () => void {
  setMentions(load());
  sound = new Audio(notificationSound);
  let timer: number | undefined;
  createEffect(() => {
    clearTimeout(timer);
    const delay = msUntilNextExpiry(mentions(), Date.now());
    if (delay !== null) timer = window.setTimeout(pruneExpired, delay);
  });
  return () => {
    clearTimeout(timer);
    flush();
    sound = null;
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
  saveTimer ??= window.setTimeout(flush, SAVE_DELAY_MS);
  return list;
}

export function record(m: Omit<Mention, "unread">) {
  const prev = mentions();
  if (prev.some((x) => x.id === m.id)) return;
  const isActive = selectedChannel()?.id === m.broadcasterId;
  const next = [{ ...m, unread: !isActive }, ...fresh(prev, Date.now())];
  setMentions(save(next.length > MAX ? next.slice(0, MAX) : next));
  if (notificationsMentionSound() && sound?.paused) {
    sound.play().catch((e: unknown) => console.warn("mention sound", e));
  }
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
export const markChannelRead = (broadcasterId: string) =>
  markReadWhere((m) => m.broadcasterId === broadcasterId);

export function dismiss(id: string) {
  setMentions((prev) => {
    const next = prev.filter((m) => m.id !== id);
    return next.length === prev.length ? prev : save(next);
  });
}

export const dismissAll = () => setMentions(save([]));
