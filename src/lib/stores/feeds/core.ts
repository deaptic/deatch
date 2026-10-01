import { createStore } from "solid-js/store";
import type { BadgeMap, FeedEntry } from "../../types/feed.ts";
import { user } from "../users.ts";

export type { FeedEntry };

export type ChannelFeed = {
  messages: FeedEntry[];
  badges: BadgeMap;
  paused: boolean;
  lastSeenEntryId: string | null;
  dividerAtEntryId: string | null;
  backfilled: boolean;
};

const CATEGORY_CAPS: Record<string, number> = {
  message: 400,
};
const DEFAULT_CAP = 50;

function categoryOf(item: FeedEntry): string {
  return item.kind === "message" ? "message" : item.notice_type;
}

function capFor(category: string): number {
  return CATEGORY_CAPS[category] ?? DEFAULT_CAP;
}

export function enforceCaps(messages: FeedEntry[]) {
  const counts: Record<string, number> = {};
  const removeIdxs: number[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const cat = categoryOf(messages[i]);
    counts[cat] = (counts[cat] ?? 0) + 1;
    if (counts[cat] > capFor(cat)) removeIdxs.push(i);
  }
  for (const i of removeIdxs) messages.splice(i, 1);
}

export const [feeds, setFeeds] = createStore<Record<string, ChannelFeed>>({});

const emptyFeed = (): ChannelFeed => ({
  messages: [],
  badges: {},
  paused: false,
  lastSeenEntryId: null,
  dividerAtEntryId: null,
  backfilled: false,
});

export function getEntryId(item: FeedEntry): string {
  return item.kind === "message" ? item.message_id : item.id;
}

export function isSilent(item: FeedEntry): boolean {
  return item.kind === "event" && item.silent === true;
}

export function lastVisible(feed: ChannelFeed): FeedEntry | undefined {
  for (let i = feed.messages.length - 1; i >= 0; i--) {
    if (!isSilent(feed.messages[i])) return feed.messages[i];
  }
  return undefined;
}

export function ensureFeed(id: string) {
  if (!feeds[id]) setFeeds(id, emptyFeed());
}

export function ownMessageText(item: FeedEntry): string | null {
  if (item.kind !== "message") return null;
  const me = user();
  if (!me || me.id !== item.chatter_user_id) return null;
  return item.fragments.map((f) => f.text).join("");
}
