import { listen } from "@tauri-apps/api/event";
import type { RawChatMessage } from "../types";
import type { EventEnvelope } from "../types/twitch/eventsub";
import { appendItem } from "../state/feeds";
import { user, isModOfChannel } from "../state/users";
import { usersById } from "../state/channels";
import { recordMention } from "../state/inbox";
import { feedKeywords, matchesAnyKeyword } from "../state/preferences";
import { mapChatMessage } from "./chat-mapper";
import { handleFollowageCommand } from "./followage";

listen<EventEnvelope<RawChatMessage>>("channel-chat-message", (e) => {
  const raw = e.payload.event;
  const ts = Date.now();
  appendItem(raw.broadcaster_user_id, mapChatMessage(raw, ts));

  if (
    user()?.id === "52679773" &&
    raw.message.text.trim().toLowerCase() === "!followage" &&
    isModOfChannel(raw.broadcaster_user_id)
  ) {
    handleFollowageCommand(raw);
  }

  const me = user();
  if (!me || raw.chatter_user_id === me.id) return;
  const myLogin = me.login.toLowerCase();
  const isMention = raw.message.fragments.some(
    (f) => f.type === "mention" && f.mention.user_login.toLowerCase() === myLogin,
  );
  const keywordHit = matchesAnyKeyword(raw.message.text, feedKeywords());
  if (!isMention && !keywordHit) return;

  const ch = usersById.get(raw.broadcaster_user_id);
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
});
