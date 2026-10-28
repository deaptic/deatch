import { listenEventSub, serverTime, unlistenAll } from "./listen.ts";
import type { RawChatMessage } from "../types/index.ts";
import { appendItem } from "../stores/feeds.ts";
import { knownUser, recordChatter, user } from "../stores/users.ts";
import * as inbox from "../services/inbox.ts";
import { feedKeywords } from "../stores/preferences.ts";
import { mentionReason } from "../utils/mention.ts";
import { chatterOf, mapChatMessage } from "../mappers/chat-mapper.ts";
import * as channelPoints from "../services/channelPoints.ts";
import * as chatActivity from "../services/chatActivity.ts";
import * as users from "../services/users.ts";
import * as badges from "../services/badges.ts";
import { userFromRef } from "../stores/channels.ts";
import * as triggers from "../services/triggers.ts";

function noteRename(raw: RawChatMessage) {
  const known = knownUser(raw.chatter_user_id);
  if (
    !known ||
    (known.login === raw.chatter_user_login &&
      known.displayName === raw.chatter_user_name)
  ) {
    return;
  }
  users.set([
    userFromRef({
      id: raw.chatter_user_id,
      login: raw.chatter_user_login,
      displayName: raw.chatter_user_name,
    }),
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
      if (appendItem(raw.broadcaster_user_id, msg)) {
        chatActivity.record(raw.broadcaster_user_id, ts);
      }
      noteRename(raw);
      if (raw.channel_points_custom_reward_id) {
        channelPoints.noteChatMessage(
          raw.broadcaster_user_id,
          raw.chatter_user_id,
          raw.channel_points_custom_reward_id,
          raw.message_id,
        );
      }

      const me = user();
      if (!me || raw.chatter_user_id === me.id) return;

      triggers.handle({
        text: raw.message.text,
        broadcasterId: raw.broadcaster_user_id,
        messageId: raw.message_id,
      });

      const reason = mentionReason(msg, me.login, feedKeywords());
      if (!reason) return;

      const ch = knownUser(raw.broadcaster_user_id);
      inbox.record({
        id: raw.message_id,
        channelId: raw.broadcaster_user_id,
        channelLogin: ch?.login ?? raw.broadcaster_user_id,
        channelName: ch?.displayName ?? raw.broadcaster_user_id,
        message: msg,
        reason,
        timestamp: ts,
      });
    }),
  ]);
}
