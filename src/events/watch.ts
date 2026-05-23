import { listen } from "@tauri-apps/api/event";
import { getUsers } from "../commands/twitch/users";
import { rememberUser } from "../state/channels";
import {
  setWatchConnected,
  setWatchedChannel,
  watchWarmedChannels,
  setWatchWarmedChannels,
} from "../state/watch";

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
  const currentByLogin = new Map(current.map((c) => [c?.login, c]));

  // Mirror the sync list: drop anything no longer reported, keep what is.
  const keep = current.filter((c) => incomingSet.has(c?.login));
  const toFetch = slugs.filter((s) => !currentByLogin.has(s));

  if (toFetch.length === 0) {
    if (keep.length !== current.length) setWatchWarmedChannels(keep);
    return;
  }

  try {
    const fresh = await getUsers({ logins: toFetch });
    for (const u of fresh) rememberUser(u);
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
    const ch = users[0];
    if (!ch) return;
    rememberUser(ch);
    setWatchedChannel(ch);
  } catch {
    // Helix lookup failed (network, auth, etc.). Drop the event silently —
    // the next channel_switched will retry.
  }
});
