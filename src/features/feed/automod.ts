import { setAutomodHoldStatus } from "./store/index.ts";
import { manageHeldAutomodMessage } from "../../platform/twitch/moderation.ts";
import type { AutomodAction } from "../../shared/types/index.ts";

export async function resolve(
  broadcasterId: string,
  messageId: string,
  action: AutomodAction,
) {
  const allow = action === "allow";
  setAutomodHoldStatus(
    broadcasterId,
    messageId,
    allow ? "approving" : "denying",
  );
  try {
    await manageHeldAutomodMessage({ messageId, action });
    setAutomodHoldStatus(
      broadcasterId,
      messageId,
      allow ? "approved" : "denied",
    );
  } catch {
    setAutomodHoldStatus(broadcasterId, messageId, "pending");
  }
}
