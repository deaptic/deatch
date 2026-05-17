const NATIVE_HOST = "com.deaptic.deatch";

const DEBUG = false;
const log = DEBUG ? console.log.bind(console, "[deatch]") : () => {};

const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

let port = null;
let reconnectDelay = RECONNECT_MIN_MS;
let reconnectTimer = null;

const tabChannels = new Map(); // tabId -> channel slug (or null)
let activeTabId = null;
let lastSent = null;
let lastSyncedKey = "";

function send(payload) {
  if (!port) return;
  try {
    port.postMessage(payload);
  } catch (e) {
    log("post failed", e);
  }
}

function emitCurrent() {
  const ch = activeTabId != null ? tabChannels.get(activeTabId) ?? null : null;
  if (ch == null) return; // don't blank the Watch tab when off a channel
  if (ch === lastSent) return;
  lastSent = ch;
  log("→", ch);
  send({ type: "channel_switched", channel: ch, ts: Date.now() });
}

function emitSync() {
  const channels = new Set();
  for (const ch of tabChannels.values()) {
    if (ch) channels.add(ch);
  }
  const list = [...channels].sort();
  const key = list.join(",");
  if (key === lastSyncedKey) return;
  lastSyncedKey = key;
  log("sync", list);
  send({ type: "sync", channels: list });
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
    const err = chrome.runtime.lastError;
    log("disconnected:", err?.message ?? "(no error)", "— retry in", reconnectDelay, "ms");
    port = null;
    scheduleReconnect();
  });

  port.onMessage.addListener((msg) => {
    log("←", msg);
  });

  // Native messaging has no onConnect — postMessage either works or fires
  // onDisconnect, so assume connected and let the disconnect handler catch
  // failures.
  log("connected to native host", NATIVE_HOST);
  reconnectDelay = RECONNECT_MIN_MS;
  send({ type: "hello", client: "deatch-ext", version: chrome.runtime.getManifest().version });
  lastSent = null;
  lastSyncedKey = "";
  emitSync();
  emitCurrent();
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connect, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "channel-changed") return;
  const tabId = sender.tab?.id;
  if (tabId == null) return;
  tabChannels.set(tabId, msg.channel);
  emitSync();
  if (tabId === activeTabId) emitCurrent();
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  activeTabId = tabId;
  emitCurrent();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabChannels.delete(tabId);
  if (tabId === activeTabId) activeTabId = null;
  emitSync();
});

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "complete" && tabId === activeTabId) emitCurrent();
});

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id != null) activeTabId = tab.id;
  connect();
})();
