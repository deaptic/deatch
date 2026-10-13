import { setAutomodHoldStatus } from "../stores/feeds.ts";
import { manageHeldAutomodMessage } from "../api/twitch/moderation.ts";

export type HoldAction = "approve" | "deny";

export async function resolve(
  broadcasterId: string,
  messageId: string,
  action: HoldAction,
) {
  const approve = action === "approve";
  setAutomodHoldStatus(
    broadcasterId,
    messageId,
    approve ? "approving" : "denying",
  );
  try {
    await manageHeldAutomodMessage({
      msgId: messageId,
      action: approve ? "allow" : "deny",
    });
    setAutomodHoldStatus(
      broadcasterId,
      messageId,
      approve ? "approved" : "denied",
    );
  } catch {
    setAutomodHoldStatus(broadcasterId, messageId, "pending");
  }
}
