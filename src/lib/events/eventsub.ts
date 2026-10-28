import { t } from "../i18n/index.ts";
import { listenApp, unlistenAll } from "./listen.ts";
import { appendLocalNotice } from "../stores/feeds.ts";
import { setChatConnected } from "../stores/eventsub.ts";
import * as recovery from "../services/recovery.ts";
import { connectFailure } from "../mappers/connect-failure.ts";

export function start(): () => void {
  return unlistenAll([
    listenApp("chatStatus", ({ broadcasterId, state }) => {
      switch (state.type) {
        case "connected":
          appendLocalNotice(
            broadcasterId,
            t("CHAT_CONNECTED"),
            "chat_connected",
          );
          break;
        case "disconnected":
          appendLocalNotice(
            broadcasterId,
            t("CHAT_DISCONNECTED"),
            "chat_disconnected",
          );
          break;
        case "rejected":
        case "failed":
        case "capped":
          appendLocalNotice(
            broadcasterId,
            connectFailure(state),
            "chat_connect_failed",
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
