import { createSignal } from "solid-js";
import notificationSound from "../../assets/notification.mp3";
import { notificationsMentionSound } from "./preferences.ts";
import { selectedChannel } from "./channels.ts";

const audio = new Audio(notificationSound);

export type Mention = {
  id: string;
  channelId: string;
  channelLogin: string;
  channelName: string;
  messageId: string;
  chatterId: string;
  chatterLogin: string;
  chatterName: string;
  chatterColor: string;
  message: string;
  timestamp: number;
  unread: boolean;
};

const MAX = 100;
const STORAGE_KEY = "mentions";

const [mentions, setMentions] = createSignal<Mention[]>(
  JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"),
);
export { mentions };

function save(list: Mention[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

export const unreadMentionCount = () =>
  mentions().filter((m) => m.unread).length;

export const channelMentionCount = (channelId: string) =>
  mentions().filter((m) => m.unread && m.channelId === channelId).length;

export function recordMention(m: Omit<Mention, "unread">) {
  const isActive = selectedChannel()?.id === m.channelId;
  let added = false;
  setMentions((prev) => {
    if (prev.some((x) => x.id === m.id)) return prev;
    added = true;
    const next = [{ ...m, unread: !isActive }, ...prev];
    return save(next.length > MAX ? next.slice(0, MAX) : next);
  });
  if (added && notificationsMentionSound()) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

function markRead(match: (m: Mention) => boolean) {
  setMentions((prev) =>
    save(prev.map((m) => (m.unread && match(m) ? { ...m, unread: false } : m)))
  );
}

export const markMentionRead = (id: string) => markRead((m) => m.id === id);
export const markAllMentionsRead = () => markRead(() => true);
export const markChannelMentionsRead = (channelId: string) =>
  markRead((m) => m.channelId === channelId);
