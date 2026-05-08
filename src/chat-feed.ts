import { createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { ChatMsg, BadgeMap } from "./components/ChatMessage";
import type { ChatNotice } from "./components/ChatNotification";
import { loadUserPreferences, saveUserPreferences } from "./preferences";

export type ChatItem = ChatMsg | ChatNotice;

export type ChannelFeed = {
  messages: ChatItem[];
  badges: BadgeMap;
  paused: boolean;
};

const MAX_MESSAGES = 500;
const TRIM_TO = 499;

const [feeds, setFeeds] = createStore<Record<string, ChannelFeed>>({});

const emptyFeed = (): ChannelFeed => ({ messages: [], badges: {}, paused: false });

export function getFeed(id: string): ChannelFeed | undefined {
  return feeds[id];
}

export function ensureFeed(id: string) {
  if (!feeds[id]) setFeeds(id, emptyFeed());
}

export function appendItem(id: string, item: ChatItem) {
  ensureFeed(id);
  setFeeds(
    id,
    produce((f) => {
      if (!f.paused && f.messages.length >= MAX_MESSAGES) {
        f.messages.splice(0, f.messages.length - TRIM_TO);
      }
      f.messages.push(item);
    }),
  );
}

export function setPaused(id: string, paused: boolean) {
  ensureFeed(id);
  setFeeds(id, "paused", paused);
}

export function setBadges(id: string, badges: BadgeMap) {
  ensureFeed(id);
  setFeeds(id, "badges", badges);
}

export function trimToLatest(id: string) {
  ensureFeed(id);
  setFeeds(
    id,
    produce((f) => {
      if (f.messages.length > MAX_MESSAGES) {
        f.messages.splice(0, f.messages.length - MAX_MESSAGES);
      }
      f.paused = false;
    }),
  );
}

export function dropFeed(id: string) {
  setFeeds(id, undefined as unknown as ChannelFeed);
}

export { feeds };

const [mutedUsersSignal, setMutedUsersSignal] = createSignal<string[]>(
  loadUserPreferences().feed.users.muted,
);

export const mutedUsers = mutedUsersSignal;

export function setMutedUsers(users: string[]) {
  const prefs = loadUserPreferences();
  saveUserPreferences({ ...prefs, feed: { ...prefs.feed, users: { ...prefs.feed.users, muted: users } } });
  setMutedUsersSignal(users);
}
