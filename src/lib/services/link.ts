import { selectedChannel } from "../stores/view.ts";
import {
  linkConnected,
  linkedChannel,
  linkMutedByLogin,
  linkWarmedChannels,
  setLinkConnected,
  setLinkedChannel,
  setLinkHasAudio,
  setLinkMutedByLogin,
  setLinkWarmedChannels,
} from "../stores/link.ts";
import {
  linkClose,
  linkFocus,
  linkSetAudio,
  linkSetMuted,
} from "../api/link.ts";
import { openUrl } from "../api/opener.ts";
import { focusWindow, onWindowFocusChanged } from "../api/window.ts";
import { channelUrl } from "../utils/twitchUrl.ts";
import type { CompressorSettings } from "../constants/audio.ts";
import { getStreamsFromIds } from "../api/twitch/streams.ts";
import { addToast } from "../stores/toasts.ts";
import * as users from "./users.ts";
import type { LinkState, SetAudioParams, User } from "../types/index.ts";
import { t } from "../i18n/index.ts";
import { createBackoff } from "../utils/backoff.ts";

const RETRY_MIN_MS = 1000;
const RETRY_MAX_MS = 15_000;

function closeTabs(tabs: User[]) {
  for (const ch of tabs)
    if (ch.login) linkClose({ channel: ch.login }).catch(() => {});
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
    addToast(t("LINK_ALL_TABS_LIVE"));
    return;
  }
  closeTabs(offline);
  addToast(t("LINK_CLOSED_OFFLINE", { count: offline.length }), "success");
}

function isMuted(login: string): boolean {
  return linkMutedByLogin()[login] === true;
}

/// The open channel, when it has a browser tab.
export function selectedLinked() {
  const sel = selectedChannel();
  return sel && linkWarmedChannels().some((c) => c.id === sel.id) ? sel : null;
}

/// Opening or closing a browser tab can bring the browser to the front; the
/// app takes focus back if it loses it this soon after. Switching away by
/// hand within that time is pulled back too, which is the trade-off.
const REFOCUS_MS = 2000;

async function keepingFocus(action: () => Promise<unknown>) {
  // Without the listener the action still runs; only the refocus is lost.
  const unlisten = await onWindowFocusChanged(
    (focused) => {
      if (focused) return;
      stop();
      focusWindow({ silent: true }).catch(() => {});
    },
    { silent: true },
  ).catch(() => () => {});
  const timer = setTimeout(stop, REFOCUS_MS);
  function stop() {
    clearTimeout(timer);
    unlisten();
  }
  await action();
}

/// Shows the open channel's browser tab, or opens the channel in the browser
/// when it has none; the extension then links the new tab.
export function openTab() {
  const tab = selectedLinked();
  if (tab) {
    linkFocus({ channel: tab.login }).catch(() => {});
    return;
  }
  const ch = selectedChannel();
  if (!ch) return;
  keepingFocus(() => openUrl(channelUrl(ch.login))).catch(() => {});
}

/// Passes the key on (false) when the open channel has no tab, so one key can
/// close a tab and otherwise open it.
export function closeTab(): boolean {
  const tab = selectedLinked();
  if (!tab) return false;
  keepingFocus(() => linkClose({ channel: tab.login })).catch(() => {});
  return true;
}

/// A dragged volume slider changes the settings every few milliseconds; they
/// go out at most this often, the latest ones last.
const AUDIO_SEND_MS = 50;
let audioTimer: number | undefined;
let audioPending: SetAudioParams | null = null;

/// Channel gains go out as factors (1 is unchanged), not percent.
export function sendAudio(
  enabled: boolean,
  compressor: CompressorSettings,
  gains: Record<string, number>,
) {
  const factors = Object.fromEntries(
    Object.entries(gains).map(([login, percent]) => [login, percent / 100]),
  );
  audioPending = { enabled, compressor: { ...compressor }, gains: factors };
  audioTimer ??= window.setTimeout(() => {
    audioTimer = undefined;
    if (audioPending) linkSetAudio(audioPending).catch(() => {});
  }, AUDIO_SEND_MS);
}

export function anyUnmuted(): boolean {
  return linkWarmedChannels().some((ch) => ch.login && !isMuted(ch.login));
}

// Only the shown tab plays; every other tab goes quiet.
export function muteOthers() {
  const focusedLogin = selectedLinked()?.login ?? null;
  for (const ch of linkWarmedChannels()) {
    if (!ch.login) continue;
    const shouldBeMuted = ch.login !== focusedLogin;
    if (isMuted(ch.login) !== shouldBeMuted) {
      linkSetMuted({ channel: ch.login, muted: shouldBeMuted }).catch(() => {});
    }
  }
}

export function toggleMuteAll() {
  const linked = linkWarmedChannels();
  if (linked.length === 0) return;
  const muteAll = anyUnmuted();
  for (const ch of linked) {
    if (!ch.login) continue;
    if (isMuted(ch.login) !== muteAll) {
      linkSetMuted({ channel: ch.login, muted: muteAll }).catch(() => {});
    }
  }
}

// null when the shown chat has no browser tab.
export function currentMuted(): boolean | null {
  const target = selectedLinked();
  return target?.login ? isMuted(target.login) : null;
}

export function toggleMuted(login: string) {
  linkSetMuted(
    { channel: login, muted: !isMuted(login) },
    { silent: false, failureMessage: t("LINK_TAB_UNREACHABLE") },
  ).catch(() => {});
}

export function toggleMute() {
  const target = selectedLinked();
  if (target?.login) toggleMuted(target.login);
}

let pendingFetch = new Set<string>();
let pendingCurrent: string | null = null;
const retry = createBackoff(RETRY_MIN_MS, RETRY_MAX_MS);

// The tab list lands before `current` so a new tab counts as linked by the
// time the app follows it.
/// A failed lookup stays pending and is retried.
async function drainPending() {
  if (!linkConnected()) return;
  if (pendingFetch.size > 0) await drainWarmed();
  if (pendingCurrent) await drainCurrent(pendingCurrent);

  if (pendingFetch.size > 0 || pendingCurrent) {
    if (linkConnected()) retry.schedule(() => void drainPending());
  } else {
    retry.succeeded();
  }
}

async function drainWarmed() {
  const toFetch = Array.from(pendingFetch);
  const fresh = await users
    .fetch({ logins: toFetch }, { silent: true })
    .catch(() => null);
  if (!fresh) return;
  for (const login of toFetch) pendingFetch.delete(login);
  const current = linkWarmedChannels();
  const known = new Set(current.map((c) => c.login));
  setLinkWarmedChannels([
    ...current,
    ...fresh.filter((u) => !known.has(u.login)),
  ]);
}

async function drainCurrent(slug: string) {
  const found = await users
    .fetch({ logins: [slug] }, { silent: true })
    .catch(() => null);
  if (!found) return;
  // An unknown login (banned, renamed) resolves to nothing; retrying would
  // never change that.
  if (pendingCurrent === slug) pendingCurrent = null;
  const [ch] = found;
  if (ch && linkedChannel()?.id !== ch.id) setLinkedChannel(ch);
}

export async function applyState({ channels, current, audio }: LinkState) {
  setLinkConnected(true);
  setLinkHasAudio(audio === true);

  const muted: Record<string, boolean> = {};
  for (const c of channels) muted[c.login.toLowerCase()] = c.muted ?? false;
  setLinkMutedByLogin(muted);

  const incoming = new Set(channels.map((c) => c.login.toLowerCase()));
  const warmed = linkWarmedChannels();
  const keep = warmed.filter((c) => incoming.has(c.login));
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
  setLinkHasAudio(false);
  pendingFetch.clear();
  pendingCurrent = null;
  retry.reset();
}
