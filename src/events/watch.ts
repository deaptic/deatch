import { listen } from "@tauri-apps/api/event";
import { getUsers } from "../commands/users";
import { rememberChannel } from "../state/channels";
import {
  setWatchConnected,
  setWatchedChannel,
  watchWarmedChannels,
  setWatchWarmedChannels,
} from "../state/watch";
import type { Channel } from "../types";

listen<{ client?: string; version?: string }>("watch:hello", () => {
  setWatchConnected(true);
  // Suppresses the cold-start install hint for returning users (race: GUI
  // starts before extension reconnects, false "install" toast otherwise).
  try { localStorage.setItem("deatch_watch_seen", "1"); } catch {}
});

listen("watch:disconnected", () => {
  setWatchConnected(false);
});

listen<{ channels: string[] }>("watch:sync", async (e) => {
  const slugs = (e.payload.channels || []).map((s) => s.toLowerCase());
  const incomingSet = new Set(slugs);
  const current = watchWarmedChannels();
  const currentByLogin = new Map(current.map((c) => [c.user_login, c]));

  // Mirror the sync list: drop anything no longer reported, keep what is.
  const keep = current.filter((c) => incomingSet.has(c.user_login));
  const toFetch = slugs.filter((s) => !currentByLogin.has(s));

  if (toFetch.length === 0) {
    if (keep.length !== current.length) setWatchWarmedChannels(keep);
    return;
  }

  try {
    const users = await getUsers({ logins: toFetch });
    const fresh = users.map<Channel>((u) => ({
      user_id: u.id,
      user_login: u.login,
      user_name: u.display_name,
      profile_image_url: u.profile_image_url ?? "",
    }));
    for (const ch of fresh) rememberChannel(ch);
    setWatchWarmedChannels([...keep, ...fresh]);
  } catch {
    if (keep.length !== current.length) setWatchWarmedChannels(keep);
  }
});

listen<{ channel: string; ts: number }>("watch:channel_switched", async (e) => {
  const slug = e.payload.channel?.toLowerCase();
  if (!slug) return;
  try {
    const users = await getUsers({ logins: [slug] });
    const u = users[0];
    if (!u) return;
    const ch: Channel = {
      user_id: u.id,
      user_login: u.login,
      user_name: u.display_name,
      profile_image_url: u.profile_image_url ?? "",
    };
    rememberChannel(ch);
    setWatchedChannel(ch);
  } catch {
    // Helix lookup failed (network, auth, etc.). Drop the event silently —
    // the next channel_switched will retry.
  }
});
