// Pure mapper from backend chat-message DTOs to the UI feed shape. Lives in
// its own file (no side effects, no `feeds.ts` import) so that `feeds.ts`
// can use it for backlog hydration without creating a cycle with the
// chat-event listener in `./chat.ts`.

import type {
  FeedMessage,
  Fragment,
  MessagePerk,
  PowerUp,
  RawChatMessage,
  RawFragment,
} from "../types/index.ts";
import type { Chatter } from "../stores/users.ts";

const PERKS: Record<string, MessagePerk> = {
  channel_points_highlighted: "highlight",
  channel_points_sub_only: "sub_only",
};

const POWER_UPS: Record<string, PowerUp> = {
  power_ups_message_effect: "message_effect",
  power_ups_gigantified_emote: "gigantified_emote",
};

export function chatterOf(msg: FeedMessage): Chatter {
  return {
    id: msg.chatter_user_id,
    login: msg.chatter_login,
    displayName: msg.chatter_name,
    color: msg.color,
    lastSeen: msg.timestamp,
  };
}

export function mapFragment(f: RawFragment): Fragment {
  switch (f.type) {
    case "emote":
      return { type: "emote", text: f.text, id: f.emote.id };
    case "mention":
      return {
        type: "mention",
        text: f.text,
        user_login: f.mention.user_login,
      };
    case "cheermote":
      return {
        type: "cheermote",
        text: f.text,
        prefix: f.cheermote.prefix,
        bits: f.cheermote.bits,
      };
    case "gif":
      return { type: "gif", text: f.text, url: f.gif.url };
    default:
      return { type: "text", text: f.text };
  }
}

/// The chatter's own words on an event, or nothing when they wrote none.
export function wordsOf(
  message: { text: string; fragments: RawFragment[] } | null | undefined,
): Fragment[] | undefined {
  return message?.text.trim() ? message.fragments.map(mapFragment) : undefined;
}

export function mapChatMessage(
  raw: RawChatMessage,
  timestamp: number,
): FeedMessage {
  return {
    kind: "message",
    message_id: raw.message_id,
    chatter_user_id: raw.chatter_user_id,
    chatter_login: raw.chatter_user_login,
    chatter_name: raw.chatter_user_name,
    color: raw.color,
    fragments: raw.message.fragments.map(mapFragment),
    badges: raw.badges,
    reply: raw.reply ?? undefined,
    timestamp,
    channel_points: channelPointsOf(raw),
    first_message: raw.message_type === "user_intro",
    cheer: raw.cheer ?? undefined,
    power_up: POWER_UPS[raw.message_type],
    deleted: raw.deleted,
    source: sourceOf(raw),
  };
}

function channelPointsOf(raw: RawChatMessage): FeedMessage["channel_points"] {
  if (raw.channel_points_custom_reward_id) return { kind: "custom_reward" };
  const perk = PERKS[raw.message_type];
  return perk ? { kind: perk } : undefined;
}

/// Only a message sent in a partner channel has a source; your own channel's
/// messages never show one, whatever the payload carries.
function sourceOf(raw: RawChatMessage): FeedMessage["source"] {
  const id = raw.source_broadcaster_user_id;
  if (!id || id === raw.broadcaster_user_id) return undefined;
  return {
    id,
    login: raw.source_broadcaster_user_login ?? "",
    name: raw.source_broadcaster_user_name ?? "",
    messageId: raw.source_message_id ?? "",
    badges: raw.source_badges ?? [],
  };
}
