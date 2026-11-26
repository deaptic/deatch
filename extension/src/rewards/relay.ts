import type { ChannelCommand } from "../link/commands.ts";
import { log } from "../shared/log.ts";
import type { TabMessage } from "../shared/messages.ts";
import { stringOrNull } from "../shared/record.ts";
import type { Tabs } from "../tabs/registry.ts";

type Answer = (request: string | null, error: string) => void;

function sendToTab(tabId: number, message: TabMessage) {
  return chrome.tabs.sendMessage(tabId, message);
}

export async function claimBonus(tabs: Tabs, channel: string) {
  for (const tabId of tabs.tabsOf(channel)) {
    await sendToTab(tabId, { type: "claim-bonus" }).catch((error: unknown) => {
      log.warn("claim failed", channel, error);
    });
  }
}

async function askLatestTab(
  tabs: Tabs,
  ask: ChannelCommand,
  message: (request: string | null) => TabMessage,
  answer: Answer,
) {
  const request = stringOrNull(ask.request);
  const tabId = tabs.latestTabOf(ask.channel);
  if (tabId == null) return answer(request, "TAB_UNREACHABLE");
  await sendToTab(tabId, message(request)).catch((error: unknown) => {
    log.warn("request not delivered", ask.channel, error);
    answer(request, "TAB_UNREACHABLE");
  });
}

export function redeemReward(tabs: Tabs, ask: ChannelCommand, answer: Answer) {
  const { reward, cost, text } = ask;
  return askLatestTab(
    tabs,
    ask,
    (request) => ({ type: "redeem", reward, cost, text, request }),
    answer,
  );
}

export function claimDrops(tabs: Tabs, ask: ChannelCommand, answer: Answer) {
  return askLatestTab(
    tabs,
    ask,
    (request) => ({ type: "claim-drops", request }),
    answer,
  );
}
