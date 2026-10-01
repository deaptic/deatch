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
        appendLocalNotice(id, `Title changed to “${raw.title}”`, NOTICE);
      }
      if (!before || before.game.id !== raw.category_id) {
        appendLocalNotice(
          id,
          `Category changed to ${raw.category_name || "none"}`,
          NOTICE,
        );
      }
    }),
  ]);
}
