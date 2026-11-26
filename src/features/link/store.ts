import { createEffect, createRoot, createSignal, on } from "solid-js";
import { selectedChannel } from "../navigation/index.ts";
import { user } from "../users/index.ts";
import { linkEnabled } from "../preferences/index.ts";
import {
  linkClaimBonus,
  linkClaimDrops,
  linkSetCompressor,
  linkClose,
  linkRedeem,
  linkFocus,
  linkSetGain,
  linkSetMuted,
} from "../../platform/link.ts";
import { openUrl } from "../../platform/opener.ts";
import { focusWindow, onWindowFocusChanged } from "../../platform/window.ts";
import { channelUrl } from "../../shared/twitchUrl.ts";
import { getStreamsFromIds } from "../../platform/twitch/streams.ts";
import { addToast } from "../../kit/toasts.ts";
import { users } from "../users/index.ts";
import * as clock from "../../shared/clock.ts";
import { isEarning } from "./earning.ts";
import type {
  LinkDrop,
  LinkAnswer,
  LinkReward,
  LinkState,
  User,
} from "../../shared/types/index.ts";
import type { InvokeOptions } from "../../platform/invoke.ts";
import { t } from "../../shared/i18n/index.ts";
import { createBackoff } from "../../shared/backoff.ts";
import { planState } from "./model.ts";

const [hostConnected, setConnected] = createSignal(false);
const [hostHasAudio, setHasAudio] = createSignal(false);
const [hostGains, setGains] = createSignal<Record<string, number> | null>(null);
const [hostBalances, setBalances] = createSignal<Record<string, number> | null>(
  null,
);
const [hostBonusReady, setBonusReady] = createSignal<string[]>([]);
const [hostRewards, setRewards] = createSignal<Record<string, LinkReward[]>>(
  {},
);
const [hostSubscribed, setSubscribed] = createSignal<Record<string, boolean>>(
  {},
);
const [hostCompressor, setHostCompressor] = createSignal<boolean | null>(null);
const [hostDrops, setDrops] = createSignal<Record<string, LinkDrop>>({});
const [hostEarnedAt, setEarnedAt] = createSignal<Record<string, string>>({});
const [hostActiveTab, setActiveTab] = createSignal<User | null>(null);
const [hostTabs, setTabs] = createSignal<User[]>([]);

const connected = () => linkEnabled() && hostConnected();
const hasAudio = () => linkEnabled() && hostHasAudio();
const gains = () => (linkEnabled() ? hostGains() : null);
const balances = () => (linkEnabled() ? hostBalances() : null);
const bonusReady = (): string[] => (linkEnabled() ? hostBonusReady() : []);
const rewards = (login: string): LinkReward[] =>
  linkEnabled() ? (hostRewards()[login] ?? []) : [];
const subscribed = (login: string): boolean | null =>
  linkEnabled() ? (hostSubscribed()[login] ?? null) : null;
const compressor = (): boolean | null =>
  linkEnabled() ? hostCompressor() : null;
const drop = (login: string): LinkDrop | null =>
  linkEnabled() ? (hostDrops()[login] ?? null) : null;
const earnedAt = (channelId: string): string | null => {
  const at = hostEarnedAt()[channelId];
  return linkEnabled() && at && isEarning(at, clock.now()) ? at : null;
};
const activeTab = () => (linkEnabled() ? hostActiveTab() : null);
const tabs = (): User[] => (linkEnabled() ? hostTabs() : []);
const [mutedByLogin, setMutedByLogin] = createSignal<Record<string, boolean>>(
  {},
);
export {
  compressor,
  drop,
  earnedAt,
  subscribed,
  activeTab,
  bonusReady,
  connected,
  gains,
  hasAudio,
  mutedByLogin,
  balances,
  rewards,
  tabs,
};

const RETRY_MIN_MS = 1000;
const RETRY_MAX_MS = 15_000;

function tabAction(): InvokeOptions {
  return { failureMessage: t("LINK_TAB_UNREACHABLE_ERROR") };
}

export function focus(login: string) {
  linkFocus({ channel: login }, tabAction()).catch(() => {});
}

export function claimBonus(login: string) {
  setBonusReady((logins) => logins.filter((l) => l !== login));
  linkClaimBonus({ channel: login }, tabAction()).catch(() => {});
}

const ANSWER_TIMEOUT_MS = 15_000;
const waiting = new Map<string, (error: string | null) => void>();

function ask(send: (request: string) => Promise<void>): Promise<string | null> {
  const request = crypto.randomUUID();
  return new Promise((resolve) => {
    const timeout = setTimeout(() => settle("TIMEOUT"), ANSWER_TIMEOUT_MS);
    function settle(error: string | null) {
      clearTimeout(timeout);
      waiting.delete(request);
      resolve(error);
    }
    waiting.set(request, settle);
    send(request).catch(() => settle("TAB_UNREACHABLE"));
  });
}

export function redeem(
  login: string,
  reward: LinkReward,
  text: string | null,
): Promise<string | null> {
  return ask((request) =>
    linkRedeem(
      { channel: login, reward: reward.id, cost: reward.cost, text, request },
      { silent: true },
    ),
  );
}

export function setCompressor(on: boolean) {
  setHostCompressor(on);
  linkSetCompressor({ on }).catch(() => {});
}

export function claimDrops(login: string): Promise<string | null> {
  return ask((request) =>
    linkClaimDrops({ channel: login, request }, { silent: true }),
  );
}

export function applyAnswer(answer: LinkAnswer) {
  waiting.get(answer.request)?.(answer.error);
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

export function setGain(login: string, gain: number) {
  setGains((current) => current && { ...current, [login]: gain });
  linkSetGain({ channel: login, gain }, { silent: true }).catch(() => {});
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
  if (!hostConnected() || !user()) return;
  if (pendingFetch.size > 0) await drainTabs();
  if (pendingCurrent) await drainCurrent(pendingCurrent);

  if (pendingFetch.size > 0 || pendingCurrent) {
    if (hostConnected()) retry.schedule(() => void drainPending());
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
  const current = hostTabs();
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
  if (ch && hostActiveTab()?.id !== ch.id) setActiveTab(ch);
}

function numbersOf(
  byLogin: Partial<Record<string, number | null>> | null | undefined,
): Record<string, number> | null {
  if (!byLogin) return null;
  return Object.fromEntries(
    Object.entries(byLogin).flatMap(([login, value]) =>
      typeof value === "number" ? [[login, value]] : [],
    ),
  );
}

export async function applyState(state: LinkState) {
  setConnected(true);
  setHasAudio(state.audio === true);
  setGains(numbersOf(state.gains));
  setBalances(numbersOf(state.balances));
  setBonusReady(state.bonusReady ?? []);
  setRewards(state.rewards ?? {});
  setSubscribed(state.subscribed ?? {});
  setDrops(state.drops ?? {});
  setHostCompressor(state.compressorOn ?? null);
  setEarnedAt(state.earnedAt ?? {});

  const warmed = hostTabs();
  const plan = planState(state, warmed, hostActiveTab()?.login ?? null);
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
  setGains(null);
  setBalances(null);
  setBonusReady([]);
  setRewards({});
  setSubscribed({});
  setDrops({});
  setEarnedAt({});
  setHostCompressor(null);
  setTabs([]);
  setActiveTab(null);
  setMutedByLogin({});
  pendingFetch.clear();
  pendingCurrent = null;
  retry.reset();
}
