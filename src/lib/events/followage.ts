import type { RawChatMessage } from "../types/index.ts";
import { getChannelFollowers } from "../api/twitch/channels.ts";
import { sendChatMessage } from "../api/twitch/chat.ts";
import { Time } from "../utils/time.ts";

export async function handleFollowageCommand(raw: RawChatMessage) {
  try {
    const res = await getChannelFollowers(
      {
        broadcasterId: raw.broadcaster_user_id,
        userId: raw.chatter_user_id,
        first: 1,
      },
      { silent: true },
    );
    const follower = res.data[0];
    const message = follower
      ? `You started following ${new Time(follower.followedAt, "R")}`
      : `You are not following yet`;
    await sendChatMessage({
      broadcasterId: raw.broadcaster_user_id,
      message,
      replyParentMessageId: raw.message_id,
    });
  } catch {
    /* ignore */
  }
}
