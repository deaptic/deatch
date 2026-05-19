const NATIVE_HOST = "com.deaptic.deatch";
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

const DEBUG = false;
const log = DEBUG ? console.log.bind(console, "[deatch]") : () => {};

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

let port = null;
let reconnectDelay = RECONNECT_MIN_MS;
let reconnectTimer = null;

const tabChannels = new Map();
let activeTabId = null;
let lastSent = null;
let lastSyncedKey = "";

function send(payload) {
  if (!port) return;
  try { port.postMessage(payload); } catch (e) { log("post failed", e); }
}

function emitCurrent() {
  const ch = activeTabId != null ? tabChannels.get(activeTabId) ?? null : null;
  if (ch == null || ch === lastSent) return; // never blank when off a channel
  lastSent = ch;
  log("→", ch);
  send({ type: "channel_switched", channel: ch, ts: Date.now() });
}

function emitSync() {
  const list = [...new Set([...tabChannels.values()].filter(Boolean))].sort();
  const key = list.join(",");
  if (key === lastSyncedKey) return;
  lastSyncedKey = key;
  log("sync", list);
  send({ type: "sync", channels: list });
}

function setTabUrl(tabId, url) {
  if (tabId == null) return false;
  const ch = channelFromUrl(url ?? "");
  if (ch != null) {
    if (tabChannels.get(tabId) === ch) return false;
    tabChannels.set(tabId, ch);
    return true;
  }
  return tabChannels.delete(tabId);
}

async function setActiveTab(tabId) {
  activeTabId = tabId;
  if (tabId != null && !tabChannels.has(tabId)) {
    try { setTabUrl(tabId, (await chrome.tabs.get(tabId)).url); } catch {}
  }
  emitCurrent();
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
  } catch (e) {
    log("connectNative threw", e);
    scheduleReconnect();
    return;
  }
  port.onDisconnect.addListener(() => {
    log("disconnected:", chrome.runtime.lastError?.message ?? "(no error)");
    port = null;
    scheduleReconnect();
  });
  port.onMessage.addListener((msg) => log("←", msg));

  reconnectDelay = RECONNECT_MIN_MS;
  lastSent = null;
  lastSyncedKey = "";
  send({ type: "hello", client: "deatch-ext", version: chrome.runtime.getManifest().version });
  emitSync();
  emitCurrent();
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "channel-changed" || sender.tab?.id == null) return;
  tabChannels.set(sender.tab.id, msg.channel);
  emitSync();
  if (sender.tab.id === activeTabId) emitCurrent();
});

chrome.tabs.onActivated.addListener(({ tabId }) => setActiveTab(tabId));

chrome.tabs.onRemoved.addListener((tabId) => {
  tabChannels.delete(tabId);
  if (tabId === activeTabId) activeTabId = null;
  emitSync();
});

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.url != null && setTabUrl(tabId, info.url)) {
    emitSync();
    if (tabId === activeTabId) emitCurrent();
  } else if (info.status === "complete" && tabId === activeTabId) {
    emitCurrent();
  }
});

// onActivated doesn't fire when focus moves between browser windows.
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const [tab] = await chrome.tabs.query({ active: true, windowId }).catch(() => []);
  if (tab?.id != null) setActiveTab(tab.id);
});

(async () => {
  const tabs = await chrome.tabs.query({ url: ["*://*.twitch.tv/*", "*://twitch.tv/*"] }).catch(() => []);
  for (const tab of tabs) setTabUrl(tab.id, tab.url);
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true }).catch(() => []);
  if (active?.id != null) activeTabId = active.id;
  connect();
})();
