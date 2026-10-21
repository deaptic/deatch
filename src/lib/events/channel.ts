import { t } from "../i18n/index.ts";
import { listenEventSub, unlistenAll } from "./listen.ts";
import type { RawChannelUpdate } from "../types/twitch/eventsub.ts";
import {
  applyChannelInfo,
  channelInfoFor,
  streamForUserId,
} from "../stores/channels.ts";
import { appendLocalNotice } from "../stores/feeds.ts";

const NOTICE = "channel_update";

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
  ]);
}
