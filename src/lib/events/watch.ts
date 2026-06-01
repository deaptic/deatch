import { listen } from "@tauri-apps/api/event";
import { getUsers } from "../api/twitch/users";
import { watchRequestState } from "../api/watch";
import { rememberUser } from "../stores/channels";
import {
  watchConnected,
  setWatchConnected,
  watchedChannel,
  setWatchedChannel,
  watchWarmedChannels,
  setWatchWarmedChannels,
  setWatchMutedByLogin,
} from "../stores/watch";

type StatePayload = {
  channels: { login: string; muted: boolean }[];
  current: string | null;
};

let pendingFetch = new Set<string>();
let pendingCurrent: string | null = null;
let retryTimer: number | null = null;
let retryDelay = 1000;

function scheduleRetry() {
  if (retryTimer != null) return;
  if (!watchConnected()) return;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    void drainPending();
  }, retryDelay);
  retryDelay = Math.min(retryDelay * 2, 15000);
}

async function drainPending() {
  if (!watchConnected()) return;

  if (pendingCurrent) {
    const slug = pendingCurrent;
    try {
      const users = await getUsers({ logins: [slug] }, { silent: true });
      const ch = users[0];
      if (ch && pendingCurrent === slug) {
        rememberUser(ch);
        if (watchedChannel()?.id !== ch.id) setWatchedChannel(ch);
        pendingCurrent = null;
      }
    } catch {}
  }

  if (pendingFetch.size > 0) {
    const toFetch = Array.from(pendingFetch);
    try {
      const fresh = await getUsers({ logins: toFetch }, { silent: true });
      for (const u of fresh) {
        rememberUser(u);
        pendingFetch.delete(u.login);
      }
      const current = watchWarmedChannels();
      const known = new Set(current.map((c) => c.login));
      setWatchWarmedChannels([
        ...current,
        ...fresh.filter((u) => !known.has(u.login)),
      ]);
    } catch {}
  }

  if (pendingFetch.size > 0 || pendingCurrent) {
    scheduleRetry();
  } else {
    retryDelay = 1000;
  }
}

listen<StatePayload>("watch:state", async (e) => {
  setWatchConnected(true);
  const { channels, current } = e.payload;

  const muted: Record<string, boolean> = {};
  for (const c of channels) muted[c.login.toLowerCase()] = !!c.muted;
  setWatchMutedByLogin(muted);

  const incomingLogins = channels.map((c) => c.login.toLowerCase());
  const incomingSet = new Set(incomingLogins);
  const currentList = watchWarmedChannels();
  const keep = currentList.filter((c) => incomingSet.has(c?.login));
  if (keep.length !== currentList.length) setWatchWarmedChannels(keep);

  const known = new Set(keep.map((c) => c.login));
  pendingFetch = new Set(incomingLogins.filter((l) => !known.has(l)));

  const cur = current?.toLowerCase() ?? null;
  if (cur) {
    if (watchedChannel()?.login === cur) {
      pendingCurrent = null;
    } else {
      pendingCurrent = cur;
    }
  } else {
    pendingCurrent = null;
    if (watchedChannel() !== null) setWatchedChannel(null);
  }

  await drainPending();
});

listen("watch:disconnected", () => {
  setWatchConnected(false);
  pendingFetch.clear();
  pendingCurrent = null;
  if (retryTimer != null) {
    window.clearTimeout(retryTimer);
    retryTimer = null;
  }
  retryDelay = 1000;
});

void watchRequestState();
