import { createSignal } from "solid-js";
import type { Mention } from "../types/index.ts";

/// Newest first; the inbox service loads, changes and saves them.
export const [mentions, setMentions] = createSignal<Mention[]>([]);

export const unreadMentionCount = () =>
  mentions().filter((m) => m.unread).length;

export const channelMentionCount = (broadcasterId: string) =>
  mentions().filter((m) => m.unread && m.broadcasterId === broadcasterId)
    .length;
