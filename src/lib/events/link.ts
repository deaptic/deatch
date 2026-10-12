import { events } from "../bindings.ts";
import { unlistenAll } from "./listen.ts";
import * as users from "../services/users.ts";
import { linkRequestState } from "../api/link.ts";
import {
  linkConnected,
  linkedChannel,
  linkWarmedChannels,
  setLinkConnected,
  setLinkedChannel,
  setLinkMutedByLogin,
  setLinkWarmedChannels,
} from "../stores/link.ts";

let pendingFetch = new Set<string>();
let pendingCurrent: string | null = null;
let retryTimer: number | null = null;
let retryDelay = 1000;

function scheduleRetry() {
  if (retryTimer != null) return;
  if (!linkConnected()) return;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    void drainPending();
  }, retryDelay);
  retryDelay = Math.min(retryDelay * 2, 15000);
}

async function drainPending() {
  if (!linkConnected()) return;

  if (pendingCurrent) {
    const slug = pendingCurrent;
    try {
      const [ch] = await users.fetch({ logins: [slug] }, { silent: true });
      // An unknown login (banned, renamed) resolves to nothing; retrying
      // would never change that.
      if (pendingCurrent === slug) pendingCurrent = null;
      if (ch && linkedChannel()?.id !== ch.id) setLinkedChannel(ch);
    } catch {}
  }

  if (pendingFetch.size > 0) {
    const toFetch = Array.from(pendingFetch);
    try {
      const fresh = await users.fetch({ logins: toFetch }, { silent: true });
      for (const login of toFetch) pendingFetch.delete(login);
      const current = linkWarmedChannels();
      const known = new Set(current.map((c) => c.login));
      setLinkWarmedChannels([
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

export function start(): () => void {
  const stop = unlistenAll([
    events.linkState.listen(async (e) => {
      setLinkConnected(true);
      const { channels, current } = e.payload;

      const muted: Record<string, boolean> = {};
      for (const c of channels) muted[c.login.toLowerCase()] = c.muted ?? false;
      setLinkMutedByLogin(muted);

      const incomingLogins = channels.map((c) => c.login.toLowerCase());
      const incomingSet = new Set(incomingLogins);
      const currentList = linkWarmedChannels();
      const keep = currentList.filter((c) => incomingSet.has(c?.login));
      if (keep.length !== currentList.length) setLinkWarmedChannels(keep);

      const known = new Set(keep.map((c) => c.login));
      pendingFetch = new Set(incomingLogins.filter((l) => !known.has(l)));

      const cur = current?.toLowerCase() ?? null;
      if (cur) {
        if (linkedChannel()?.login === cur) {
          pendingCurrent = null;
        } else {
          pendingCurrent = cur;
        }
      } else {
        pendingCurrent = null;
        if (linkedChannel() !== null) setLinkedChannel(null);
      }

      await drainPending();
    }),
    events.linkDisconnected.listen(() => {
      setLinkConnected(false);
      pendingFetch.clear();
      pendingCurrent = null;
      if (retryTimer != null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
      retryDelay = 1000;
    }),
  ]);
  // No host connected yet is the normal case at startup.
  linkRequestState().catch(() => {});
  return stop;
}
