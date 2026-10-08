import { listenEventSub, unlistenAll } from "./listen.ts";
import type { RawChatMessage } from "../types/index.ts";
import { appendItem } from "../stores/feeds.ts";
import { knownUser, user } from "../stores/users.ts";
import { recordMention } from "../stores/inbox.ts";
import { feedKeywords } from "../stores/preferences.ts";
import { isMention } from "../utils/mention.ts";
import { mapChatMessage } from "./chat-mapper.ts";
import { noteChatRedemption } from "./channelPointsCorrelator.ts";
import * as chatActivity from "../services/chatActivity.ts";
import * as users from "../services/users.ts";
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
      const raw = e.payload.event;
      const ts = Date.now();
      const msg = mapChatMessage(raw, ts);
      if (appendItem(raw.broadcaster_user_id, msg)) {
        chatActivity.record(raw.broadcaster_user_id, ts);
      }
      noteRename(raw);
      if (raw.channel_points_custom_reward_id) {
        noteChatRedemption(
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

      if (!isMention(msg, me.login, feedKeywords())) return;

      const ch = knownUser(raw.broadcaster_user_id);
      recordMention({
        id: raw.message_id,
        channelId: raw.broadcaster_user_id,
        channelLogin: ch?.login ?? raw.broadcaster_user_id,
        channelName: ch?.displayName ?? raw.broadcaster_user_id,
        messageId: raw.message_id,
        chatterId: raw.chatter_user_id,
        chatterLogin: raw.chatter_user_login,
        chatterName: raw.chatter_user_name,
        chatterColor: raw.color,
        message: raw.message.text,
        timestamp: ts,
      });
    }),
  ]);
}
