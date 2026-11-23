import {
  listenEventSub,
  serverTime,
  unlistenAll,
} from "../../../platform/listen.ts";
import type { RawChatMessage } from "../../../lib/types/index.ts";
import { appendItem } from "../store/index.ts";
import { knownUser, recordChatter, user } from "../../users/index.ts";
import * as inbox from "../../inbox/index.ts";
import { feedKeywords } from "../../preferences/index.ts";
import { mentionReason } from "../entries/mention.ts";
import { chatterOf, mapChatMessage } from "../entries/chat.ts";
import * as channelPoints from "../channelPoints.ts";
import { users } from "../../users/index.ts";
import * as badges from "../../badges/index.ts";
import * as triggers from "../../triggers/index.ts";

function noteRename(raw: RawChatMessage) {
  const known = knownUser(raw.chatter_user_id);
  if (
    !known ||
    (known.login === raw.chatter_user_login &&
      known.displayName === raw.chatter_user_name)
  ) {
    return;
  }
  users.note([
    {
      id: raw.chatter_user_id,
      login: raw.chatter_user_login,
      displayName: raw.chatter_user_name,
    },
  ]);
}

export function start(): () => void {
  return unlistenAll([
    listenEventSub<RawChatMessage>("channel.chat.message", (e) => {
      const raw = e.event;
      const ts = serverTime(e);
      const msg = mapChatMessage(raw, ts);
      if (msg.source) badges.loadSource(msg.source);
      recordChatter(raw.broadcaster_user_id, chatterOf(msg));
      appendItem(raw.broadcaster_user_id, msg);
      noteRename(raw);
      if (raw.channel_points_custom_reward_id) {
        channelPoints.noteChatMessage(
          raw.broadcaster_user_id,
          raw.chatter_user_id,
          raw.channel_points_custom_reward_id,
          raw.message_id,
        );
      }

      triggers.handle({
        text: raw.message.text,
        broadcasterId: raw.broadcaster_user_id,
        messageId: raw.message_id,
        chatter: {
          id: raw.chatter_user_id,
          login: raw.chatter_user_login,
          displayName: raw.chatter_user_name,
        },
        badgeSets: raw.badges.map((b) => b.set_id),
      });

      const me = user();
      if (!me || raw.chatter_user_id === me.id) return;

      const reason = mentionReason(msg, me.login, feedKeywords());
      if (!reason) return;

      const ch = knownUser(raw.broadcaster_user_id);
      inbox.record({
        id: raw.message_id,
        broadcasterId: raw.broadcaster_user_id,
        broadcasterLogin:
          ch?.login ?? raw.broadcaster_user_login ?? raw.broadcaster_user_id,
        broadcasterName:
          ch?.displayName ??
          raw.broadcaster_user_name ??
          raw.broadcaster_user_id,
        message: msg,
        reason,
        timestamp: ts,
      });
    }),
  ]);
}
