import { selectedChannel } from "../stores/view.ts";
import {
  linkConnected,
  linkedChannel,
  linkMutedByLogin,
  linkWarmedChannels,
  setLinkConnected,
  setLinkedChannel,
  setLinkMutedByLogin,
  setLinkWarmedChannels,
} from "../stores/link.ts";
import { openUrl } from "@tauri-apps/plugin-opener";
import { linkClose, linkFocus, linkSetMuted } from "../api/link.ts";
import { channelUrl } from "../utils/twitchUrl.ts";
import { getStreamsFromIds } from "../api/twitch/streams.ts";
import { addToast } from "../stores/toasts.ts";
import * as users from "./users.ts";
import type { LinkState, User } from "../types/index.ts";

const RETRY_MIN_MS = 1000;
const RETRY_MAX_MS = 15_000;

function closeTabs(tabs: User[]) {
  for (const ch of tabs) if (ch?.login) void linkClose(ch.login);
}

export function closeAll() {
  closeTabs(linkWarmedChannels());
}

// Checks live status fresh so a tab that just went live stays open.
export async function closeOffline() {
  const tabs = linkWarmedChannels();
  if (tabs.length === 0) return;
  const streams = await getStreamsFromIds({ userIds: tabs.map((c) => c.id) });
  const live = new Set(streams.map((s) => s.user.id));
  const offline = tabs.filter((c) => !live.has(c.id));
  if (offline.length === 0) {
    addToast("Every tab is live");
    return;
  }
  closeTabs(offline);
  addToast(
    `Closed ${offline.length} offline ${offline.length === 1 ? "tab" : "tabs"}`,
    "success",
  );
}

function isMuted(login: string): boolean {
  return linkMutedByLogin()[login] === true;
}

function selectedLinked() {
  const sel = selectedChannel();
  return sel && linkWarmedChannels().some((c) => c?.id === sel.id) ? sel : null;
}

/// Shows the open channel's browser tab, or opens the channel in the browser
/// when it has none; the extension then links the new tab.
export function openTab() {
  const tab = selectedLinked();
  if (tab) return void linkFocus(tab.login);
  const ch = selectedChannel();
  if (ch) void openUrl(channelUrl(ch.login));
}

export function closeTab() {
  const tab = selectedLinked();
  if (tab) void linkClose(tab.login);
}

export function anyUnmuted(): boolean {
  return linkWarmedChannels().some((ch) => ch?.login && !isMuted(ch.login));
}

// Only the shown tab plays; every other tab goes quiet.
export function muteOthers() {
  const focusedLogin = selectedLinked()?.login ?? null;
  for (const ch of linkWarmedChannels()) {
    if (!ch?.login) continue;
    const shouldBeMuted = ch.login !== focusedLogin;
    if (isMuted(ch.login) !== shouldBeMuted) {
      void linkSetMuted(ch.login, shouldBeMuted);
    }
  }
}

export function toggleMuteAll() {
  const linked = linkWarmedChannels();
  if (linked.length === 0) return;
  const muteAll = anyUnmuted();
  for (const ch of linked) {
    if (!ch?.login) continue;
    if (isMuted(ch.login) !== muteAll) void linkSetMuted(ch.login, muteAll);
  }
}

// null when the shown chat has no browser tab.
export function currentMuted(): boolean | null {
  const target = selectedLinked();
  return target?.login ? isMuted(target.login) : null;
}

export function toggleMuted(login: string) {
  linkSetMuted(login, !isMuted(login)).catch(() =>
    addToast(
      "Couldn't reach the browser tab. Check that Link is connected.",
      "error",
    )
  );
}

export function toggleMute() {
  const target = selectedLinked();
  if (target?.login) toggleMuted(target.login);
}

let pendingFetch = new Set<string>();
let pendingCurrent: string | null = null;
let retryTimer: number | undefined;
let retryDelay = RETRY_MIN_MS;

function scheduleRetry() {
  if (retryTimer !== undefined || !linkConnected()) return;
  retryTimer = window.setTimeout(() => {
    retryTimer = undefined;
    void drainPending();
  }, retryDelay);
  retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
}

// The tab list lands before `current` so a new tab counts as linked by the
// time the app follows it.
async function drainPending() {
  if (!linkConnected()) return;

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
    } catch (e) {
      console.warn("link tab lookup failed, retrying", e);
    }
  }

  if (pendingCurrent) {
    const slug = pendingCurrent;
    try {
      const [ch] = await users.fetch({ logins: [slug] }, { silent: true });
      // An unknown login (banned, renamed) resolves to nothing; retrying
      // would never change that.
      if (pendingCurrent === slug) pendingCurrent = null;
      if (ch && linkedChannel()?.id !== ch.id) setLinkedChannel(ch);
    } catch (e) {
      console.warn("link current channel lookup failed, retrying", e);
    }
  }

  if (pendingFetch.size > 0 || pendingCurrent) {
    scheduleRetry();
  } else {
    retryDelay = RETRY_MIN_MS;
  }
}

export async function applyState({ channels, current }: LinkState) {
  setLinkConnected(true);

  const muted: Record<string, boolean> = {};
  for (const c of channels) muted[c.login.toLowerCase()] = c.muted ?? false;
  setLinkMutedByLogin(muted);

  const incoming = new Set(channels.map((c) => c.login.toLowerCase()));
  const warmed = linkWarmedChannels();
  const keep = warmed.filter((c) => incoming.has(c?.login));
  if (keep.length !== warmed.length) setLinkWarmedChannels(keep);

  const known = new Set(keep.map((c) => c.login));
  pendingFetch = new Set([...incoming].filter((l) => !known.has(l)));

  const cur = current?.toLowerCase() ?? null;
  pendingCurrent = cur && linkedChannel()?.login !== cur ? cur : null;
  if (!cur && linkedChannel() !== null) setLinkedChannel(null);

  await drainPending();
}

export function disconnect() {
  setLinkConnected(false);
  pendingFetch.clear();
  pendingCurrent = null;
  window.clearTimeout(retryTimer);
  retryTimer = undefined;
  retryDelay = RETRY_MIN_MS;
}
