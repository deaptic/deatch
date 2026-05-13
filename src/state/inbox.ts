import { createSignal } from "solid-js";
import notificationSound from "../assets/notification.mp3";
import { notificationsMentionSound } from "./preferences";

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

const [mentionsSig, setMentionsSig] = createSignal<Mention[]>([]);
export const mentions = mentionsSig;

export const unreadMentionCount = () => mentionsSig().filter((m) => m.unread).length;

export const channelMentionCount = (channelId: string) =>
  mentionsSig().filter((m) => m.unread && m.channelId === channelId).length;

export function recordMention(m: Omit<Mention, "unread">) {
  let added = false;
  setMentionsSig((prev) => {
    if (prev.some((x) => x.id === m.id)) return prev;
    added = true;
    const next = [{ ...m, unread: true } as Mention, ...prev];
    return next.length > MAX ? next.slice(0, MAX) : next;
  });
  if (added && notificationsMentionSound()) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

export function markMentionRead(id: string) {
  setMentionsSig((prev) =>
    prev.map((m) => (m.id === id && m.unread ? { ...m, unread: false } : m)),
  );
}

export function markAllMentionsRead() {
  setMentionsSig((prev) =>
    prev.map((m) => (m.unread ? { ...m, unread: false } : m)),
  );
}

export function markChannelMentionsRead(channelId: string) {
  setMentionsSig((prev) =>
    prev.map((m) =>
      m.unread && m.channelId === channelId ? { ...m, unread: false } : m,
    ),
  );
}
