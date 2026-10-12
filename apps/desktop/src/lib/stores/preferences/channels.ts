import { persist, prefs, setPrefs } from "./core.ts";
import { user } from "../users.ts";
import { moved } from "../../utils/moved.ts";

const isOwn = (id: string) => id === user()?.id;

export const pinnedChannels = () =>
  prefs.menu.channels.pinned.filter((id) => !isOwn(id));

export function pinChannel(id: string): boolean {
  if (isOwn(id) || prefs.menu.channels.pinned.includes(id)) return false;
  setPrefs("menu", "channels", "pinned", (p) => [...p, id]);
  persist();
  return true;
}

export function unpinChannel(id: string) {
  setPrefs("menu", "channels", "pinned", (p) => p.filter((x) => x !== id));
  persist();
}

export function reorderPinnedChannels(from: number, to: number) {
  if (from === to) return;
  setPrefs("menu", "channels", "pinned", moved(pinnedChannels(), from, to));
  persist();
}
