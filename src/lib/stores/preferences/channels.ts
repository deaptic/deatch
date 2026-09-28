import { persist, prefs, setPrefs } from "./core.ts";

export const pinnedChannels = () => prefs.menu.channels.pinned;

export function pinChannel(user_id: string) {
  if (prefs.menu.channels.pinned.includes(user_id)) return;
  setPrefs("menu", "channels", "pinned", (p) => [...p, user_id]);
  persist();
}

export function unpinChannel(user_id: string) {
  setPrefs(
    "menu",
    "channels",
    "pinned",
    (p) => p.filter((id) => id !== user_id),
  );
  persist();
}

export function reorderPinnedChannels(from: number, to: number) {
  if (from === to) return;
  setPrefs("menu", "channels", "pinned", (p) => {
    const next = [...p];
    const [item] = next.splice(from, 1);
    next.splice(from < to ? to - 1 : to, 0, item);
    return next;
  });
  persist();
}
