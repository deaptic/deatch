import type { RawChatMessage } from "../types";
import { getChannelFollowers } from "../commands/twitch/channels";
import { sendChatMessage } from "../commands/twitch/chat";
import { Time } from "../utils/time";

export async function handleFollowageCommand(raw: RawChatMessage) {
  try {
    const res = await getChannelFollowers(
      { broadcasterId: raw.broadcaster_user_id, userId: raw.chatter_user_id, first: 1 },
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
