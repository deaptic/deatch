import { events } from "../bindings.ts";
import { unlistenAll } from "./listen.ts";
import { appendLocalNotice } from "../stores/feeds.ts";
import { knownUser } from "../stores/users.ts";
import { setChatConnected } from "../stores/eventsub.ts";
import * as backlog from "../services/backlog.ts";
import * as chatSettings from "../services/chatSettings.ts";

const CHAT = "channel.chat.message" as const;

export function start(): () => void {
  return unlistenAll([
    events.eventSubFailed.listen((e) => {
      console.error("EventSub error:", e.payload);
    }),
    events.eventSubSubscription.listen(({ payload }) => {
      if (payload.kind !== CHAT) return;
      const { broadcasterId, status } = payload;
      switch (status.type) {
        case "subscribed":
          appendLocalNotice(
            broadcasterId,
            "Connected to chat",
            "chat_connected",
          );
          break;
        case "unsubscribed":
          appendLocalNotice(
            broadcasterId,
            "Disconnected from chat",
            "chat_disconnected",
          );
          break;
        case "failed":
          appendLocalNotice(
            broadcasterId,
            `Failed to connect to chat: ${status.error}`,
            "chat_connect_failed",
          );
          break;
      }
    }),
    events.eventSubConnection.listen((e) => {
      setChatConnected(e.payload.connected);
    }),
    events.eventSubRecovered.listen((e) => {
      for (const id of e.payload.broadcasterIds) {
        void chatSettings.load(id);
        const login = knownUser(id)?.login;
        if (login) backlog.fillGap(id, login, e.payload.since);
      }
    }),
  ]);
}
