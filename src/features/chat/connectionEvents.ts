import { t } from "../../shared/i18n/index.ts";
import { listenApp, unlistenAll } from "../../platform/listen.ts";
import { appendLocalNotice, recovery, connectFailure } from "../feed/index.ts";
import { setChatConnected } from "./connection.ts";
import {
  CHAT_CONNECT_FAILED,
  CHAT_CONNECTED,
  CHAT_DISCONNECTED,
} from "../../shared/moderateActions.ts";

export function start(): () => void {
  return unlistenAll([
    listenApp("chatStatus", ({ broadcasterId, state }) => {
      switch (state.type) {
        case "connected":
          appendLocalNotice(
            broadcasterId,
            t("FEED_CONNECTED_LINE"),
            CHAT_CONNECTED,
          );
          break;
        case "disconnected":
          appendLocalNotice(
            broadcasterId,
            t("FEED_DISCONNECTED_LINE"),
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
