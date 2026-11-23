import { prefs, setPrefs } from "./core.ts";
import { isOwnChannel as isOwn } from "../permissions/index.ts";
import { moved } from "../../shared/moved.ts";

export const pinnedChannels = () =>
  prefs.menu.channels.pinned.filter((id) => !isOwn(id));

export type PinOutcome = "pinned" | "alreadyPinned" | "own";

export function pinChannel(broadcasterId: string): PinOutcome {
  if (isOwn(broadcasterId)) return "own";
  if (prefs.menu.channels.pinned.includes(broadcasterId)) {
    return "alreadyPinned";
  }
  setPrefs("menu", "channels", "pinned", (p) => [...p, broadcasterId]);
  return "pinned";
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
