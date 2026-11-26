import { log } from "../shared/log.ts";
import type { Tabs } from "./registry.ts";

export async function muteChannel(tabs: Tabs, channel: string, muted: boolean) {
  for (const tabId of tabs.tabsOf(channel)) {
    await chrome.tabs.update(tabId, { muted }).catch((error: unknown) => {
      log.warn("mute failed", channel, error);
    });
  }
}

export async function focusChannel(tabs: Tabs, channel: string) {
  const tabId = tabs.latestTabOf(channel);
  if (tabId == null) return;
  await chrome.tabs.update(tabId, { active: true }).catch((error: unknown) => {
    log.warn("focus failed", channel, error);
  });
}

export async function closeChannel(tabs: Tabs, channel: string) {
  await chrome.tabs.remove(tabs.tabsOf(channel)).catch((error: unknown) => {
    log.warn("close failed", channel, error);
  });
}
