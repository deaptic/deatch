const NATIVE_HOST = "com.deaptic.deatch";
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

const NON_CHANNEL_PATHS = new Set([
  "directory", "settings", "subscriptions", "wallet", "inventory",
  "drops", "friends", "following", "messages", "search", "p", "popout",
  "videos", "downloads", "turbo", "prime", "jobs", "store", "payments",
]);

function channelFromUrl(url) {
  let u;
  try { u = new URL(url); } catch { return null; }
  if (!/(^|\.)twitch\.tv$/.test(u.hostname)) return null;
  const seg = u.pathname.split("/").filter(Boolean);
  if (seg.length !== 1) return null;
  const name = seg[0].toLowerCase();
  if (NON_CHANNEL_PATHS.has(name)) return null;
  if (!/^[a-z0-9_]{3,25}$/.test(name)) return null;
  return name;
}

const tabChannels = new Map();
const tabMuted = new Map();
let activeTabId = null;
let lastFocusedTwitchTabId = null;

let port = null;
let reconnectDelay = RECONNECT_MIN_MS;
let reconnectTimer = null;
let lastStateKey = "";

function buildState() {
  const byChannel = new Map();
  for (const [tabId, ch] of tabChannels) {
    if (!ch) continue;
    const m = tabMuted.get(tabId) === true;
    const prev = byChannel.get(ch);
    byChannel.set(ch, prev === undefined ? m : prev && m);
  }
  const channels = [...byChannel.entries()]
    .map(([login, muted]) => ({ login, muted }))
    .sort((a, b) => a.login.localeCompare(b.login));

  const activeCh = activeTabId != null ? tabChannels.get(activeTabId) ?? null : null;
  const fallbackCh =
    lastFocusedTwitchTabId != null
      ? tabChannels.get(lastFocusedTwitchTabId) ?? null
      : null;
  const current = activeCh ?? fallbackCh ?? null;

  return { type: "state", channels, current };
}

function emitState() {
  if (!port) return;
  const state = buildState();
  const key = JSON.stringify(state.channels) + "|" + (state.current ?? "");
  if (key === lastStateKey) return;
  lastStateKey = key;
  try { port.postMessage(state); } catch {}
}

function applyTabUrl(tabId, url) {
  const ch = channelFromUrl(url || "");
  if (ch) {
    if (tabChannels.get(tabId) === ch) return false;
    tabChannels.set(tabId, ch);
    return true;
  }
  const had = tabChannels.delete(tabId);
  if (had) tabMuted.delete(tabId);
  if (had && tabId === lastFocusedTwitchTabId) lastFocusedTwitchTabId = null;
  return had;
}

async function applyMute(channel, muted) {
  if (!channel) return;
  let changed = false;
  for (const [tabId, ch] of tabChannels) {
    if (ch !== channel) continue;
    try {
      await chrome.tabs.update(tabId, { muted: !!muted });
      changed = true;
    } catch {}
  }
  if (changed) emitState();
}

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
    if (!msg || typeof msg.type !== "string") return;
    if (msg.type === "get_state") {
      lastStateKey = "";
      emitState();
    } else if (msg.type === "set_muted" && typeof msg.channel === "string") {
      void applyMute(msg.channel.toLowerCase(), !!msg.muted);
    }
  });
  reconnectDelay = RECONNECT_MIN_MS;
  lastStateKey = "";
  emitState();
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "channel-changed" || sender.tab?.id == null) return;
  tabChannels.set(sender.tab.id, msg.channel);
  if (sender.tab.id === activeTabId) lastFocusedTwitchTabId = sender.tab.id;
  emitState();
});

async function setActiveTab(tabId) {
  activeTabId = tabId;
  if (tabId != null && !tabChannels.has(tabId)) {
    try {
      const tab = await chrome.tabs.get(tabId);
      applyTabUrl(tabId, tab.url);
      if (tab.mutedInfo && !tabMuted.has(tabId)) {
        tabMuted.set(tabId, !!tab.mutedInfo.muted);
      }
    } catch {}
  }
  if (tabId != null && tabChannels.get(tabId)) lastFocusedTwitchTabId = tabId;
  emitState();
}

chrome.tabs.onActivated.addListener(({ tabId }) => setActiveTab(tabId));

chrome.tabs.onRemoved.addListener((tabId) => {
  tabChannels.delete(tabId);
  tabMuted.delete(tabId);
  if (tabId === activeTabId) activeTabId = null;
  if (tabId === lastFocusedTwitchTabId) lastFocusedTwitchTabId = null;
  emitState();
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  let dirty = false;
  if (info.url != null && applyTabUrl(tabId, info.url)) dirty = true;
  if (info.mutedInfo) {
    tabMuted.set(tabId, !!info.mutedInfo.muted);
    dirty = true;
  } else if (tab?.mutedInfo && !tabMuted.has(tabId)) {
    tabMuted.set(tabId, !!tab.mutedInfo.muted);
  }
  if (tabId === activeTabId && tabChannels.get(tabId)) {
    lastFocusedTwitchTabId = tabId;
  }
  if (dirty) emitState();
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const [tab] = await chrome.tabs.query({ active: true, windowId }).catch(() => []);
  if (tab?.id != null) setActiveTab(tab.id);
});

(async () => {
  const tabs = await chrome.tabs.query({ url: ["*://*.twitch.tv/*", "*://twitch.tv/*"] }).catch(() => []);
  for (const tab of tabs) {
    applyTabUrl(tab.id, tab.url);
    if (tab.mutedInfo) tabMuted.set(tab.id, !!tab.mutedInfo.muted);
  }
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true }).catch(() => []);
  if (active?.id != null) {
    activeTabId = active.id;
    if (tabChannels.get(active.id)) lastFocusedTwitchTabId = active.id;
  }
  connect();
})();
