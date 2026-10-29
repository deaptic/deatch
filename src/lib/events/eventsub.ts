import { t } from "../i18n/index.ts";
import { listenApp, unlistenAll } from "./listen.ts";
import { appendLocalNotice } from "../stores/feeds.ts";
import { setChatConnected } from "../stores/eventsub.ts";
import * as recovery from "../services/recovery.ts";
import { connectFailure } from "../mappers/connectFailure.ts";
import {
  CHAT_CONNECT_FAILED,
  CHAT_CONNECTED,
  CHAT_DISCONNECTED,
} from "../constants/events.ts";

export function start(): () => void {
  return unlistenAll([
    listenApp("chatStatus", ({ broadcasterId, state }) => {
      switch (state.type) {
        case "connected":
          appendLocalNotice(broadcasterId, t("CHAT_CONNECTED"), CHAT_CONNECTED);
          break;
        case "disconnected":
          appendLocalNotice(
            broadcasterId,
            t("CHAT_DISCONNECTED"),
            CHAT_DISCONNECTED,
          );
          break;
        case "rejected":
        case "failed":
        case "capped":
          appendLocalNotice(
            broadcasterId,
            connectFailure(state),
            CHAT_CONNECT_FAILED,
          );
          break;
      }
    }),
    listenApp("eventSubConnection", ({ connected }) => {
      setChatConnected(connected);
    }),
    listenApp("eventSubRecovered", ({ broadcasterId, since }) => {
      recovery.recover(broadcasterId, since);
    }),
  ]);
}
