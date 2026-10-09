import { listenEventSub, unlistenAll } from "./listen.ts";
import type { RawChatMessage } from "../types/index.ts";
import { appendItem } from "../stores/feeds.ts";
import { knownUser, recordChatter, user } from "../stores/users.ts";
import { recordMention } from "../stores/inbox.ts";
import { feedKeywords } from "../stores/preferences.ts";
import { mentionReason } from "../utils/mention.ts";
import { chatterOf, mapChatMessage } from "./chat-mapper.ts";
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
      // Server time keeps live and backfilled messages on one clock.
      const ts = new Date(e.payload.timestamp).getTime();
      const msg = mapChatMessage(raw, ts);
      recordChatter(raw.broadcaster_user_id, chatterOf(msg));
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

      const reason = mentionReason(msg, me.login, feedKeywords());
      if (!reason) return;

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
        fragments: msg.fragments,
        reason,
        timestamp: ts,
      });
    }),
  ]);
}
