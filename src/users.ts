import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import type { TwitchUser } from "./types";

const [userInfoCache, setUserInfoCache] = createSignal<Record<string, TwitchUser>>({});
export { userInfoCache };

const pendingIds = new Set<string>();

export async function fetchUserInfo(ids: string[]): Promise<void> {
  const cache = userInfoCache();
  const toFetch = ids.filter((id) => !cache[id] && !pendingIds.has(id));
  if (!toFetch.length) return;
  toFetch.forEach((id) => pendingIds.add(id));
  try {
    const users = await invoke<TwitchUser[]>("get_users_by_id", { userIds: toFetch });
    setUserInfoCache((prev) => {
      const next = { ...prev };
      for (const u of users) next[u.id] = u;
      return next;
    });
  } catch {
    // ignore
  } finally {
    toFetch.forEach((id) => pendingIds.delete(id));
  }
}
