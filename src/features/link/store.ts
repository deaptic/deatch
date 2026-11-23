import { createEffect, createRoot, createSignal, on } from "solid-js";
import { selectedChannel } from "../../lib/stores/view.ts";
import { user } from "../../lib/stores/users.ts";
import {
  linkClose,
  linkFocus,
  linkSetAudio,
  linkSetMuted,
} from "../../platform/link.ts";
import { openUrl } from "../../platform/opener.ts";
import { focusWindow, onWindowFocusChanged } from "../../platform/window.ts";
import { channelUrl } from "../../lib/utils/twitchUrl.ts";
import type { CompressorSettings } from "../../lib/constants/audio.ts";
import { getStreamsFromIds } from "../../platform/twitch/streams.ts";
import { addToast } from "../../kit/toasts.ts";
import * as users from "../../lib/services/users.ts";
import type { LinkState, SetAudioParams, User } from "../../lib/types/index.ts";
import type { InvokeOptions } from "../../platform/invoke.ts";
import { t } from "../../shared/i18n/index.ts";
import { createBackoff } from "../../lib/utils/backoff.ts";
import { planState } from "./model.ts";

const [connected, setConnected] = createSignal(false);
const [hasAudio, setHasAudio] = createSignal(false);
const [activeTab, setActiveTab] = createSignal<User | null>(null);
const [tabs, setTabs] = createSignal<User[]>([]);
const [mutedByLogin, setMutedByLogin] = createSignal<Record<string, boolean>>(
  {},
);
export { activeTab, connected, hasAudio, mutedByLogin, tabs };

const RETRY_MIN_MS = 1000;
const RETRY_MAX_MS = 15_000;

function tabAction(): InvokeOptions {
  return { failureMessage: t("LINK_TAB_UNREACHABLE_ERROR") };
}

export function focus(login: string) {
  linkFocus({ channel: login }, tabAction()).catch(() => {});
}

export function close(login: string) {
  linkClose({ channel: login }, tabAction()).catch(() => {});
}

function closeEach(list: User[]) {
  for (const ch of list) if (ch.login) close(ch.login);
}

export function closeAll() {
  closeEach(tabs());
}

export async function closeOffline() {
  const open = tabs();
  if (open.length === 0) return;
  const streams = await getStreamsFromIds({ userIds: open.map((c) => c.id) });
  const live = new Set(streams.map((s) => s.user.id));
  const offline = open.filter((c) => !live.has(c.id));
  if (offline.length === 0) {
    addToast(t("LINK_ALL_TABS_LIVE_TOAST"));
    return;
  }
  closeEach(offline);
  addToast(
    t("LINK_OFFLINE_TABS_CLOSED_TOAST", { count: offline.length }),
    "success",
  );
}

function isMuted(login: string): boolean {
  return mutedByLogin()[login] === true;
}

export function selectedTab() {
  const sel = selectedChannel();
  return sel && tabs().some((c) => c.id === sel.id) ? sel : null;
}

const REFOCUS_MS = 2000;

async function keepingFocus(action: () => Promise<unknown>) {
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

export function openTab() {
  const tab = selectedTab();
  if (tab) {
    focus(tab.login);
    return;
  }
  const ch = selectedChannel();
  if (!ch) return;
  keepingFocus(() => openUrl(channelUrl(ch.login))).catch(() => {});
}

export function closeTab(): boolean {
  const tab = selectedTab();
  if (!tab) return false;
  keepingFocus(() => linkClose({ channel: tab.login }, tabAction())).catch(
    () => {},
  );
  return true;
}

const AUDIO_SEND_MS = 50;
let audioTimer: ReturnType<typeof setTimeout> | undefined;
let audioPending: SetAudioParams | null = null;

export function sendAudio(
  enabled: boolean,
  compressor: CompressorSettings,
  gains: Record<string, number>,
) {
  const factors = Object.fromEntries(
    Object.entries(gains).map(([login, percent]) => [login, percent / 100]),
  );
  audioPending = { enabled, compressor: { ...compressor }, gains: factors };
  audioTimer ??= setTimeout(() => {
    audioTimer = undefined;
    if (audioPending) {
      linkSetAudio(audioPending, { silent: true }).catch(() => {});
    }
  }, AUDIO_SEND_MS);
}

export function anyUnmuted(): boolean {
  return tabs().some((ch) => ch.login && !isMuted(ch.login));
}

export function muteOthers() {
  setOthersMuted(tabAction());
}

export function muteOthersSilently() {
  setOthersMuted({ silent: true });
}

function setOthersMuted(options: InvokeOptions) {
  const focusedLogin = selectedTab()?.login ?? null;
  for (const ch of tabs()) {
    if (!ch.login) continue;
    const shouldBeMuted = ch.login !== focusedLogin;
    if (isMuted(ch.login) !== shouldBeMuted) {
      linkSetMuted({ channel: ch.login, muted: shouldBeMuted }, options).catch(
        () => {},
      );
    }
  }
}

export function toggleMuteAll() {
  const linked = tabs();
  if (linked.length === 0) return;
  const muteAll = anyUnmuted();
  for (const ch of linked) {
    if (!ch.login) continue;
    if (isMuted(ch.login) !== muteAll) {
      linkSetMuted({ channel: ch.login, muted: muteAll }, tabAction()).catch(
        () => {},
      );
    }
  }
}

export function currentMuted(): boolean | null {
  const target = selectedTab();
  return target?.login ? isMuted(target.login) : null;
}

export function toggleMuted(login: string) {
  linkSetMuted({ channel: login, muted: !isMuted(login) }, tabAction()).catch(
    () => {},
  );
}

export function toggleMute() {
  const target = selectedTab();
  if (target?.login) toggleMuted(target.login);
}

let pendingFetch = new Set<string>();
let pendingCurrent: string | null = null;
const retry = createBackoff(RETRY_MIN_MS, RETRY_MAX_MS);

async function drainPending() {
  if (!connected() || !user()) return;
  if (pendingFetch.size > 0) await drainTabs();
  if (pendingCurrent) await drainCurrent(pendingCurrent);

  if (pendingFetch.size > 0 || pendingCurrent) {
    if (connected()) retry.schedule(() => void drainPending());
  } else {
    retry.succeeded();
  }
}

async function drainTabs() {
  const toFetch = Array.from(pendingFetch);
  const fetched = await users
    .fetchFresh({ logins: toFetch }, { silent: true })
    .catch(() => null);
  if (!fetched) return;
  const stillOpen = fetched.filter((u) => pendingFetch.has(u.login));
  for (const login of toFetch) pendingFetch.delete(login);
  const current = tabs();
  const known = new Set(current.map((c) => c.login));
  setTabs([...current, ...stillOpen.filter((u) => !known.has(u.login))]);
}

async function drainCurrent(slug: string) {
  const found = await users
    .fetchFresh({ logins: [slug] }, { silent: true })
    .catch(() => null);
  if (!found) return;
  if (pendingCurrent !== slug) return;
  pendingCurrent = null;
  const [ch] = found;
  if (ch && activeTab()?.id !== ch.id) setActiveTab(ch);
}

export async function applyState(state: LinkState) {
  setConnected(true);
  setHasAudio(state.audio === true);

  const warmed = tabs();
  const plan = planState(state, warmed, activeTab()?.login ?? null);
  setMutedByLogin(plan.muted);
  if (plan.keep.length !== warmed.length) setTabs(plan.keep);
  pendingFetch = plan.fetch;
  pendingCurrent = plan.lookUp;
  if (plan.unlink) setActiveTab(null);

  await drainPending();
}

export function watchSignIn(): () => void {
  return createRoot((dispose) => {
    createEffect(
      on(user, (signedIn) => {
        if (signedIn) void drainPending();
      }),
    );
    return dispose;
  });
}

export function disconnect() {
  setConnected(false);
  setHasAudio(false);
  setTabs([]);
  setActiveTab(null);
  setMutedByLogin({});
  pendingFetch.clear();
  pendingCurrent = null;
  retry.reset();
}
