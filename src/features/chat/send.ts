import { sendChatMessage } from "../../platform/twitch/chat.ts";
import type { InvokeOptions } from "../../platform/invoke.ts";
import { appendLocalNotice } from "../feed/index.ts";
import { addToast } from "../../kit/toasts.ts";
import type { SendChatMessageParams } from "../../shared/types/index.ts";
import { dropMessage } from "./dropReason.ts";

export type SendOutcome = "sent" | "held" | "failed";

export async function send(
  params: SendChatMessageParams,
  options?: InvokeOptions,
): Promise<SendOutcome> {
  try {
    const result = await sendChatMessage(params, options);
    if (result.isSent) return "sent";
    if (result.dropReason?.code === "held") {
      appendLocalNotice(params.broadcasterId, dropMessage(result.dropReason));
      return "held";
    }
    const reason = dropMessage(result.dropReason);
    if (options?.silent) console.warn(`message dropped: ${reason}`);
    else addToast(reason, "error");
    return "failed";
  } catch {
    return "failed";
  }
}
