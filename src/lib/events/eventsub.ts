import { t } from "../i18n/index.ts";
import { events } from "../bindings.ts";
import { unlistenAll } from "./listen.ts";
import { appendLocalNotice } from "../stores/feeds.ts";
import { setChatConnected } from "../stores/eventsub.ts";
import * as recovery from "../services/recovery.ts";

export function start(): () => void {
  return unlistenAll([
    events.chatStatus.listen(({ payload }) => {
      const { broadcasterId, state } = payload;
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
        case "failed":
          appendLocalNotice(
            broadcasterId,
            t("CHAT_CONNECT_FAILED", { error: state.error }),
            "chat_connect_failed",
          );
          break;
      }
    }),
    events.eventSubConnection.listen((e) => {
      setChatConnected(e.payload.connected);
    }),
    events.eventSubRecovered.listen((e) => {
      recovery.recover(e.payload.broadcasterId, e.payload.since);
    }),
  ]);
}
