import { commands } from "../../bindings.ts";
import type {
  BannedUser,
  BanUserParams,
  BroadcasterUserParams,
  DeleteChatMessagesParams,
  ManageHeldAutomodMessageParams,
  WarnUserParams,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";
import { t } from "../../i18n/index.ts";

export async function deleteChatMessages(
  params: DeleteChatMessagesParams,
  options?: InvokeOptions,
): Promise<void> {
  const successMessage = params.messageId
    ? t("TOAST_MESSAGE_DELETED")
    : t("TOAST_CHAT_CLEARED");
  await invokeCommand(commands.deleteChatMessages, [params], {
    successMessage,
    ...options,
  });
}

export async function banUser(
  params: BanUserParams,
  options?: InvokeOptions,
): Promise<void> {
  const successMessage = params.duration
    ? t("TOAST_USER_TIMED_OUT")
    : t("TOAST_USER_BANNED");
  await invokeCommand(commands.banUser, [params], {
    successMessage,
    ...options,
  });
}

export async function unbanUser(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.unbanUser, [params], {
    successMessage: t("TOAST_USER_UNBANNED"),
    ...options,
  });
}

export function getBan(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<BannedUser | null> {
  return invokeCommand(commands.getBan, [params], options);
}

export async function warnUser(
  params: WarnUserParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.warnUser, [params], {
    successMessage: t("TOAST_USER_WARNED"),
    ...options,
  });
}

export async function manageHeldAutomodMessage(
  params: ManageHeldAutomodMessageParams,
  options?: InvokeOptions,
): Promise<void> {
  const successMessage =
    params.action === "allow"
      ? t("TOAST_MESSAGE_APPROVED")
      : t("TOAST_MESSAGE_DENIED");
  await invokeCommand(commands.manageHeldAutomodMessage, [params], {
    successMessage,
    ...options,
  });
}
