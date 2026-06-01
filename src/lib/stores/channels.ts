import { createSignal } from "solid-js";
import type { Stream } from "../types/twitch/stream.ts";
import type { User } from "../types/twitch/user.ts";
import { menuChannelPinned } from "./preferences.ts";
import { watchWarmedChannels } from "./watch.ts";

const LAST_CHANNEL_KEY = "last_selected_channel";

const [selectedChannelSig, setSelectedChannelSig] = createSignal<User | null>(null);
export const selectedChannel = selectedChannelSig;

export const [liveStreams, setLiveStreams] = createSignal<Stream[]>([]);

export const usersById = new Map<string, User>();

export function setSelectedChannel(u: User | null) {
  setSelectedChannelSig(u);
  if (!u) return;
  try {
    localStorage.setItem(LAST_CHANNEL_KEY, JSON.stringify({
      id: u.id,
      login: u.login,
      displayName: u.displayName,
      profileImageUrl: u.profileImageUrl,
    }));
  } catch {}
}

export function rememberUser(u: User) {
  usersById.set(u.id, u);
}

export function streamForUserId(userId: string): Stream | undefined {
  return liveStreams().find((s) => s.user.id === userId);
}

export function channelsInOrder(): User[] {
  const pinnedIds = menuChannelPinned();
  const pinnedSet = new Set(pinnedIds);
  const warmedSet = new Set(watchWarmedChannels().map((c) => c?.id));
  const live = liveStreams();
  const ordered: User[] = [];
  for (const id of pinnedIds) {
    const u = usersById.get(id) ?? userFromStream(live, id);
    if (u) ordered.push(u);
  }
  for (const s of live) {
    if (pinnedSet.has(s.user.id) || warmedSet.has(s.user.id)) continue;
    const u = usersById.get(s.user.id) ?? streamUserAsUser(s);
    ordered.push(u);
  }
  return ordered;
}

function userFromStream(streams: Stream[], userId: string): User | undefined {
  const s = streams.find((x) => x.user.id === userId);
  return s ? streamUserAsUser(s) : undefined;
}

function streamUserAsUser(s: Stream): User {
  return {
    id: s.user.id,
    login: s.user.login,
    displayName: s.user.displayName,
    profileImageUrl: "",
    description: "",
    broadcasterType: "",
    createdAt: "",
  };
}

export function loadLastChannel(): User | null {
  try {
    const raw = localStorage.getItem(LAST_CHANNEL_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v.id !== "string") return null;
    return {
      id: v.id,
      login: v.login ?? "",
      displayName: v.displayName ?? "",
      profileImageUrl: v.profileImageUrl ?? "",
      description: "",
      broadcasterType: "",
      createdAt: "",
    };
  } catch {
    return null;
  }
}
