import { prefs, setPrefs } from "./core.ts";
import { user } from "../users.ts";
import { moved } from "../../utils/moved.ts";

const isOwn = (id: string) => id === user()?.id;

export const pinnedChannels = () =>
  prefs.menu.channels.pinned.filter((id) => !isOwn(id));

export function pinChannel(broadcasterId: string): boolean {
  if (
    isOwn(broadcasterId) ||
    prefs.menu.channels.pinned.includes(broadcasterId)
  )
    return false;
  setPrefs("menu", "channels", "pinned", (p) => [...p, broadcasterId]);
  return true;
}

export function unpinChannel(broadcasterId: string) {
  setPrefs("menu", "channels", "pinned", (p) =>
    p.filter((x) => x !== broadcasterId),
  );
}

export function reorderPinnedChannels(from: number, to: number) {
  if (from === to) return;
  setPrefs("menu", "channels", "pinned", moved(pinnedChannels(), from, to));
}
