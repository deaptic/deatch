import { currentChannel } from "../shared/channel.ts";
import type { Life } from "../shared/life.ts";
import { log } from "../shared/log.ts";
import type { TabMessage } from "../shared/messages.ts";
import { asRecord } from "../shared/record.ts";
import { type Flag, watchFlag } from "../shared/storage.ts";
import {
  attributeOf,
  emit,
  EVENTS,
  listen,
  type PageKey,
  readPage,
  readPageJson,
  readAnswer,
  ANSWERS,
  writePage,
} from "../shared/protocol.ts";

type PageFlag = Flag & PageKey;

const FLAGS: PageFlag[] = ["autoClaim", "autoDrops", "playerStats"];

const showFlag = (key: PageFlag, on: boolean) =>
  writePage(key, on ? "on" : null);

function showChannel() {
  const channel = currentChannel();
  if (channel !== readPage("channel")) writePage("channel", channel);
}

function send(message: object, failure: string) {
  chrome.runtime.sendMessage(message).catch((error: unknown) => {
    log.warn(failure, error);
  });
}

function sendReport() {
  const report = readPageJson("report");
  if (!report) return;
  send({ ...asRecord(report), type: "report" }, "channel report not sent");
}

function relayFromBackground(message: TabMessage) {
  if (message.type === "claim-bonus") emit(EVENTS.claimBonus);
  if (message.type === "claim-drops") {
    emit(EVENTS.claimDrops, { request: message.request });
  }
  if (message.type === "redeem") {
    const { reward, cost, text, request } = message;
    emit(EVENTS.redeem, { reward, cost, text, request });
  }
}

export function startBridge(life: Life) {
  for (const key of FLAGS) {
    watchFlag(key, (on) => showFlag(key, on));
  }

  showChannel();
  life.observe(
    document.documentElement,
    { childList: true, subtree: true },
    showChannel,
  );

  life.observe(
    document.documentElement,
    { attributeFilter: [attributeOf("report")] },
    sendReport,
  );

  for (const [event, type] of Object.entries(ANSWERS)) {
    listen(life, event, (detail) => {
      send({ type, ...readAnswer(detail) }, "answer not sent");
    });
  }

  chrome.runtime.onMessage.addListener(relayFromBackground);
}
