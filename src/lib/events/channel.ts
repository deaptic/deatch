import { formatLocale, t } from "../i18n/index.ts";
import { listenEventSub, unlistenAll } from "./listen.ts";
import type {
  RawChannelUpdate,
  RawSharedChatEnd,
  RawSharedChatSession,
  RawStreamOffline,
  RawStreamOnline,
} from "../types/twitch/eventsub.ts";
import {
  applyChannelInfo,
  channelInfoFor,
  streamForUserId,
} from "../stores/channels.ts";
import { appendLocalNotice } from "../stores/feeds.ts";

const NOTICE = "channel_update";
const SHARED_CHAT = "shared_chat_session";

function appendSharedChat(
  raw: RawSharedChatSession,
  key: "SHARED_CHAT_BEGIN" | "SHARED_CHAT_UPDATE",
) {
  const partners = raw.participants
    .filter((p) => p.broadcaster_user_id !== raw.broadcaster_user_id)
    .map((p) => p.broadcaster_user_name);
  appendLocalNotice(
    raw.broadcaster_user_id,
    t(key, { channels: new Intl.ListFormat(formatLocale()).format(partners) }),
    SHARED_CHAT,
  );
}

export function start(): () => void {
  return unlistenAll([
    listenEventSub<RawChannelUpdate>("channel.update", (e) => {
      const raw = e.payload.event;
      const id = raw.broadcaster_user_id;
      const before = streamForUserId(id) ?? channelInfoFor(id);
      applyChannelInfo({
        broadcaster: {
          id,
          login: raw.broadcaster_user_login,
          displayName: raw.broadcaster_user_name,
        },
        title: raw.title,
        game: { id: raw.category_id, name: raw.category_name },
      });
      if (!before || before.title !== raw.title) {
        appendLocalNotice(
          id,
          t("CHANNEL_TITLE_CHANGED", { title: raw.title }),
          NOTICE,
        );
      }
      if (!before || before.game.id !== raw.category_id) {
        appendLocalNotice(
          id,
          t("CHANNEL_CATEGORY_CHANGED", {
            category: raw.category_name || t("CHANNEL_CATEGORY_NONE"),
          }),
          NOTICE,
        );
      }
    }),
    listenEventSub<RawSharedChatSession>(
      "channel.shared_chat.begin",
      (e) => appendSharedChat(e.payload.event, "SHARED_CHAT_BEGIN"),
    ),
    listenEventSub<RawSharedChatSession>(
      "channel.shared_chat.update",
      (e) => appendSharedChat(e.payload.event, "SHARED_CHAT_UPDATE"),
    ),
    listenEventSub<RawSharedChatEnd>(
      "channel.shared_chat.end",
      (e) =>
        appendLocalNotice(
          e.payload.event.broadcaster_user_id,
          t("SHARED_CHAT_END"),
          SHARED_CHAT,
        ),
    ),
    listenEventSub<RawStreamOnline>("stream.online", (e) => {
      const raw = e.payload.event;
      appendLocalNotice(
        raw.broadcaster_user_id,
        t("STREAM_ONLINE", {
          channel: raw.broadcaster_user_name,
          type: raw.type,
        }),
        "stream_online",
      );
    }),
    listenEventSub<RawStreamOffline>("stream.offline", (e) => {
      const raw = e.payload.event;
      appendLocalNotice(
        raw.broadcaster_user_id,
        t("STREAM_OFFLINE", { channel: raw.broadcaster_user_name }),
        "stream_offline",
      );
    }),
  ]);
}
