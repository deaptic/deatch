import { postChatMessage } from "../api/twitch/chat.ts";
import type { InvokeOptions } from "../api/utils.ts";
import { appendLocalNotice } from "../stores/feeds.ts";
import { addToast } from "../stores/toasts.ts";
import type { SendChatMessageParams } from "../types/index.ts";
import { dropMessage } from "../utils/dropReason.ts";

type SendOutcome = "sent" | "held" | "failed";

export async function send(
  params: SendChatMessageParams,
  options?: InvokeOptions,
): Promise<SendOutcome> {
  try {
    const result = await postChatMessage(params, options);
    if (result.isSent) return "sent";
    if (result.dropReason?.code === "held") {
      appendLocalNotice(params.broadcasterId, dropMessage(result.dropReason));
      return "held";
    }
    addToast(dropMessage(result.dropReason), "error");
    return "failed";
  } catch {
    return "failed";
  }
}
