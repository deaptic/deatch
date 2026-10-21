import { t } from "../i18n/index.ts";
import { postChatMessage } from "../api/twitch/chat.ts";
import type { InvokeOptions } from "../api/utils.ts";
import { appendLocalNotice } from "../stores/feeds.ts";
import { addToast } from "../stores/toasts.ts";
import type { SendChatMessageParams } from "../types/index.ts";

export type SendOutcome = "sent" | "held" | "failed";

export async function send(
  params: SendChatMessageParams,
  options?: InvokeOptions,
): Promise<SendOutcome> {
  try {
    const result = await postChatMessage(params, options);
    if (result.isSent) return "sent";
    if (result.held) {
      appendLocalNotice(
        params.broadcasterId,
        t("CHAT_MESSAGE_HELD"),
      );
      return "held";
    }
    addToast(result.dropReason ?? t("CHAT_MESSAGE_DROPPED"), "error");
    return "failed";
  } catch {
    return "failed";
  }
}
