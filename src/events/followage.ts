import type { RawChatMessage } from "../types";
import { getChannelFollowers } from "../commands/channels";
import { sendChatMessage } from "../commands/chat";

export async function handleFollowageCommand(raw: RawChatMessage) {
  try {
    const res = await getChannelFollowers(
      { broadcasterId: raw.broadcaster_user_id, userId: raw.chatter_user_id, first: 1 },
      { silent: true },
    );
    const follower = res.data[0];
    const message = follower
      ? `You have been following since ${new Date(follower.followed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
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
