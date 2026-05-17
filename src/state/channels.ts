import { createSignal } from "solid-js";
import type { Channel } from "../types";
import { user } from "./users";
import { menuChannelPinned } from "./preferences";

const LAST_CHANNEL_KEY = "last_selected_channel";

const [selectedChannelSig, setSelectedChannelSig] = createSignal<Channel | null>(null);

export const selectedChannel = selectedChannelSig;

export const [liveChannels, setLiveChannels] = createSignal<Channel[]>([]);

export function setSelectedChannel(ch: Channel | null) {
  setSelectedChannelSig(ch);
  if (!ch) return;
  try {
    localStorage.setItem(LAST_CHANNEL_KEY, JSON.stringify({
      user_id: ch.user_id,
      user_login: ch.user_login,
      user_name: ch.user_name,
      profile_image_url: ch.profile_image_url,
    }));
  } catch {}
}

export const channelsById = new Map<string, Channel>();

export function rememberChannel(ch: Channel) {
  channelsById.set(ch.user_id, ch);
}

export function channelsInOrder(): Channel[] {
  const pinnedIds = menuChannelPinned();
  const pinnedSet = new Set(pinnedIds);
  const live = liveChannels();
  const ordered: Channel[] = [];
  for (const id of pinnedIds) {
    const ch = channelsById.get(id) ?? live.find((c) => c.user_id === id);
    if (ch) ordered.push(ch);
  }
  for (const ch of live) if (!pinnedSet.has(ch.user_id)) ordered.push(ch);
  const u = user();
  if (u) {
    ordered.push({
      user_id: u.id,
      user_login: u.login,
      user_name: u.display_name,
      profile_image_url: u.profile_image_url ?? "",
    });
  }
  return ordered;
}

export function nextChannelInOrder(direction: 1 | -1): Channel | null {
  const ordered = channelsInOrder();
  if (ordered.length === 0) return null;
  const idx = ordered.findIndex((c) => c.user_id === selectedChannel()?.user_id);
  const next =
    idx === -1
      ? direction === 1 ? 0 : ordered.length - 1
      : (idx + direction + ordered.length) % ordered.length;
  return ordered[next];
}

export function loadLastChannel(): Channel | null {
  try {
    const raw = localStorage.getItem(LAST_CHANNEL_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v.user_id !== "string") return null;
    return {
      user_id: v.user_id,
      user_login: v.user_login ?? "",
      user_name: v.user_name ?? "",
      profile_image_url: v.profile_image_url ?? "",
    };
  } catch {
    return null;
  }
}
