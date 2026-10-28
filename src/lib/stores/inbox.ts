import { createSignal } from "solid-js";
import notificationSound from "../../assets/notification.mp3";
import { notificationsMentionSound } from "./preferences.ts";
import { selectedChannel } from "./view.ts";
import { fresh } from "./inboxRetention.ts";
import type { Mention } from "../types/index.ts";
import { upgradeMention } from "./inboxUpgrade.ts";

const audio = new Audio(notificationSound);

const MAX = 100;
const STORAGE_KEY = "mentions";
const SAVE_DELAY_MS = 1000;

const initialMentions: Mention[] = (() => {
  try {
    const stored: Parameters<typeof upgradeMention>[0][] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    const upgraded = stored.map(upgradeMention).filter((m) => m !== null);
    return fresh(upgraded, Date.now());
  } catch {
    return [];
  }
})();

const [mentions, setMentions] = createSignal<Mention[]>(initialMentions);
export { mentions };

let saveTimer: number | undefined;
let unsaved: Mention[] | undefined;

export function flushMentions() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (!unsaved) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unsaved));
  } catch (e) {
    console.warn("mentions not persisted", e);
  }
  unsaved = undefined;
}

function save(list: Mention[]) {
  unsaved = list;
  saveTimer ??= setTimeout(flushMentions, SAVE_DELAY_MS);
  return list;
}

export const unreadMentionCount = () =>
  mentions().filter((m) => m.unread).length;

export const channelMentionCount = (channelId: string) =>
  mentions().filter((m) => m.unread && m.channelId === channelId).length;

export function recordMention(m: Omit<Mention, "unread">) {
  const prev = mentions();
  if (prev.some((x) => x.id === m.id)) return;
  const isActive = selectedChannel()?.id === m.channelId;
  const next = [{ ...m, unread: !isActive }, ...fresh(prev, Date.now())];
  setMentions(save(next.length > MAX ? next.slice(0, MAX) : next));
  if (notificationsMentionSound() && audio.paused) {
    audio.play().catch(() => {});
  }
}

export function pruneExpired() {
  setMentions((prev) => {
    const next = fresh(prev, Date.now());
    return next.length === prev.length ? prev : save(next);
  });
}

function markRead(match: (m: Mention) => boolean) {
  const prev = mentions();
  const unread = (m: Mention) => m.unread && match(m);
  if (!prev.some(unread)) return;
  setMentions(save(prev.map((m) => (unread(m) ? { ...m, unread: false } : m))));
}

export const markMentionRead = (id: string) => markRead((m) => m.id === id);
export const markChannelMentionsRead = (channelId: string) =>
  markRead((m) => m.channelId === channelId);

export function dismissMention(id: string) {
  setMentions((prev) => {
    const next = prev.filter((m) => m.id !== id);
    return next.length === prev.length ? prev : save(next);
  });
}

export const dismissAllMentions = () => setMentions(save([]));
