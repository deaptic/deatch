const NON_CHANNEL_PATHS = new Set([
  "directory",
  "settings",
  "subscriptions",
  "wallet",
  "inventory",
  "drops",
  "friends",
  "following",
  "messages",
  "search",
  "p",
  "popout",
  "videos",
  "downloads",
  "turbo",
  "prime",
  "jobs",
  "store",
  "payments",
  "login",
  "signup",
  "logout",
]);

function channelFromUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)twitch\.tv$/.test(u.hostname)) return null;
  const seg = u.pathname.split("/").filter(Boolean);
  // Channel pages have exactly one path segment (e.g. /xqc, not /xqc/clip/...).
  if (seg.length !== 1) return null;
  const name = seg[0].toLowerCase();
  if (NON_CHANNEL_PATHS.has(name)) return null;
  if (!/^[a-z0-9_]{3,25}$/.test(name)) return null;
  return name;
}

const NATIVE_HOST = "com.deaptic.deatch";
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

const tabChannels = new Map();
const tabMuted = new Map();
const tabFocusedAt = new Map();
let activeTabId = null;

let port = null;
let reconnectDelay = RECONNECT_MIN_MS;
let reconnectTimer = null;
let lastStateKey = "";

function mostRecentTwitchTab() {
  let best = null;
  for (const tabId of tabChannels.keys()) {
    const at = tabFocusedAt.get(tabId) ?? 0;
    if (best == null || at > (tabFocusedAt.get(best) ?? 0)) best = tabId;
  }
  return best;
}

function buildState() {
  const byChannel = new Map();
  for (const [tabId, ch] of tabChannels) {
    const m = tabMuted.get(tabId) === true;
    const prev = byChannel.get(ch);
    byChannel.set(ch, prev === undefined ? m : prev && m);
  }
  const channels = [...byChannel.entries()]
    .map(([login, muted]) => ({ login, muted }))
    .sort((a, b) => a.login.localeCompare(b.login));

  const activeCh = activeTabId != null
    ? tabChannels.get(activeTabId) ?? null
    : null;
  const current = activeCh ?? tabChannels.get(mostRecentTwitchTab()) ?? null;

  return { type: "state", channels, current };
}

function emitState() {
  if (!port) return;
  const state = buildState();
  const key = JSON.stringify(state.channels) + "|" + (state.current ?? "");
  if (key === lastStateKey) return;
  lastStateKey = key;
  try {
    port.postMessage(state);
  } catch {}
}

function forgetTab(tabId) {
  tabMuted.delete(tabId);
  tabFocusedAt.delete(tabId);
  return tabChannels.delete(tabId);
}

function applyTab(tab) {
  const ch = channelFromUrl(tab.url || "");
  if (!ch) return forgetTab(tab.id);
  if (!tabFocusedAt.has(tab.id)) {
    tabFocusedAt.set(tab.id, tab.lastAccessed ?? 0);
  }
  if (tab.mutedInfo) tabMuted.set(tab.id, !!tab.mutedInfo.muted);
  if (tabChannels.get(tab.id) === ch) return false;
  tabChannels.set(tab.id, ch);
  return true;
}

function tabsOf(channel) {
  return [...tabChannels].filter(([, ch]) => ch === channel).map(([id]) => id);
}

async function applyMute(channel, muted) {
  for (const tabId of tabsOf(channel)) {
    await chrome.tabs.update(tabId, { muted }).catch(() => {});
  }
}

// Activates the tab inside its window without raising the browser, so the
// desktop app keeps focus.
async function focusChannel(channel) {
  const tabId =
    tabsOf(channel).sort((a, b) =>
      (tabFocusedAt.get(b) ?? 0) - (tabFocusedAt.get(a) ?? 0)
    )[0];
  if (tabId != null) {
    await chrome.tabs.update(tabId, { active: true }).catch(() => {});
  }
}

async function closeChannel(channel) {
  await chrome.tabs.remove(tabsOf(channel)).catch(() => {});
}

const COMMANDS = {
  get_state: () => {
    lastStateKey = "";
    emitState();
  },
  set_muted: (msg) => applyMute(msg.channel, !!msg.muted),
  focus: (msg) => focusChannel(msg.channel),
  close: (msg) => closeChannel(msg.channel),
};

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connect, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
}

function connect() {
  clearTimeout(reconnectTimer);
  try {
    port = chrome.runtime.connectNative(NATIVE_HOST);
  } catch {
    scheduleReconnect();
    return;
  }
  port.onDisconnect.addListener(() => {
    port = null;
    scheduleReconnect();
  });
  port.onMessage.addListener((msg) => {
    const run = COMMANDS[msg?.type];
    if (!run) return;
    if (typeof msg.channel === "string") {
      msg.channel = msg.channel.toLowerCase();
    } else if (msg.type !== "get_state") return;
    void run(msg);
  });
  reconnectDelay = RECONNECT_MIN_MS;
  lastStateKey = "";
  emitState();
}

async function setActiveTab(tabId) {
  activeTabId = tabId;
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (tab) applyTab(tab);
  if (tabChannels.has(tabId)) tabFocusedAt.set(tabId, Date.now());
  emitState();
}

chrome.tabs.onActivated.addListener(({ tabId }) => setActiveTab(tabId));

chrome.tabs.onRemoved.addListener((tabId) => {
  forgetTab(tabId);
  if (tabId === activeTabId) activeTabId = null;
  emitState();
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.url == null && !info.mutedInfo) return;
  applyTab(tab);
  if (tabId === activeTabId && tabChannels.has(tabId)) {
    tabFocusedAt.set(tabId, Date.now());
  }
  emitState();
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const [tab] = await chrome.tabs.query({ active: true, windowId }).catch(
    () => [],
  );
  if (tab?.id != null) setActiveTab(tab.id);
});

(async () => {
  const tabs = await chrome.tabs.query({
    url: ["*://*.twitch.tv/*", "*://twitch.tv/*"],
  }).catch(() => []);
  for (const tab of tabs) applyTab(tab);
  const [active] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  }).catch(() => []);
  activeTabId = active?.id ?? null;
  connect();
})();
