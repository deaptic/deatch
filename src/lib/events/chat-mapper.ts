// Pure mapper from backend chat-message DTOs to the UI feed shape. Lives in
// its own file (no side effects, no `feeds.ts` import) so that `feeds.ts`
// can use it for backlog hydration without creating a cycle with the
// chat-event listener in `./chat.ts`.

import type {
  FeedMessage,
  Fragment,
  RawChatMessage,
  RawFragment,
} from "../types/index.ts";

const CHANNEL_POINT_TYPES = new Set([
  "channel_points_highlighted",
  "channel_points_sub_only",
  "power_ups_message_effect",
  "power_ups_gigantified_emote",
]);

function mapFragment(f: RawFragment): Fragment {
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
      return { type: "cheermote", text: f.text };
    default:
      return { type: "text", text: f.text };
  }
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
    channel_points: !!raw.channel_points_custom_reward_id ||
      CHANNEL_POINT_TYPES.has(raw.message_type),
    channel_points_custom_reward: !!raw.channel_points_custom_reward_id,
    first_message: raw.message_type === "user_intro",
    deleted: raw.deleted,
  };
}
