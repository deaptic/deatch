import type { Tabs } from "./registry.ts";

const TWITCH_TABS = ["*://*.twitch.tv/*", "*://twitch.tv/*"];

export function watchTabs(tabs: Tabs, onChange: () => void) {
  async function activate(tabId: number) {
    tabs.setActive(tabId);
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (tab) tabs.apply(tab);
    tabs.touch(tabId, Date.now());
    onChange();
  }

  chrome.tabs.onActivated.addListener(({ tabId }) => void activate(tabId));

  chrome.tabs.onRemoved.addListener((tabId) => {
    tabs.remove(tabId);
    onChange();
  });

  chrome.tabs.onReplaced.addListener((addedId, removedId) => {
    tabs.replace(addedId, removedId);
    chrome.tabs.get(addedId).then(
      (tab) => {
        tabs.apply(tab);
        onChange();
      },
      () => onChange(),
    );
  });

  chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (info.url == null && info.status == null && !info.mutedInfo) return;
    tabs.apply(tab);
    if (tabs.isActive(tabId)) tabs.touch(tabId, Date.now());
    onChange();
  });

  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) return;
    void chrome.tabs
      .query({ active: true, windowId })
      .catch(() => [])
      .then(([tab]) => {
        if (tab?.id != null) void activate(tab.id);
      });
  });
}

export async function loadTabs(tabs: Tabs) {
  const open = await chrome.tabs.query({ url: TWITCH_TABS }).catch(() => []);
  for (const tab of open) tabs.apply(tab);
  const [active] = await chrome.tabs
    .query({ active: true, lastFocusedWindow: true })
    .catch(() => []);
  tabs.setActive(active?.id ?? null);
}
