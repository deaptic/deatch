import { commands } from "../../bindings.ts";
import type {
  BannedUser,
  BanUserParams,
  BroadcasterParams,
  BroadcasterUserParams,
  DeleteChatMessagesParams,
  ManageHeldAutomodMessageParams,
  ResolveUnbanRequestParams,
  UnbanRequest,
  UpdateShieldModeParams,
  UserRef,
  WarnUserParams,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";
import { t } from "../../i18n/index.ts";

export function getModeratedChannels(
  options?: InvokeOptions,
): Promise<UserRef[]> {
  return invokeCommand(commands.getModeratedChannels, [], options);
}

export function getShieldMode(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<boolean> {
  return invokeCommand(commands.getShieldMode, [params], options);
}

export function updateShieldMode(
  params: UpdateShieldModeParams,
  options?: InvokeOptions,
): Promise<boolean> {
  return invokeCommand(commands.updateShieldMode, [params], {
    successMessage: t(
      params.active ? "HEADER_SHIELD_ON_TOAST" : "HEADER_SHIELD_OFF_TOAST",
    ),
    ...options,
  });
}

export async function deleteChatMessages(
  params: DeleteChatMessagesParams,
  options?: InvokeOptions,
): Promise<void> {
  const successMessage = params.messageId
    ? t("FEED_MESSAGE_DELETED_TOAST")
    : t("HEADER_CHAT_CLEARED_TOAST");
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
    ? t("BAN_TIMED_OUT_TOAST")
    : t("BAN_BANNED_TOAST");
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
    successMessage: t("BAN_UNBANNED_TOAST"),
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
    successMessage: t("WARN_WARNED_TOAST"),
    ...options,
  });
}

export async function manageHeldAutomodMessage(
  params: ManageHeldAutomodMessageParams,
  options?: InvokeOptions,
): Promise<void> {
  const successMessage =
    params.action === "allow"
      ? t("FEED_AUTOMOD_ALLOWED_TOAST")
      : t("FEED_AUTOMOD_DENIED_TOAST");
  await invokeCommand(commands.manageHeldAutomodMessage, [params], {
    successMessage,
    ...options,
  });
}

export function getUnbanRequests(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<UnbanRequest[]> {
  return invokeCommand(commands.getUnbanRequests, [params], options);
}

export async function resolveUnbanRequest(
  params: ResolveUnbanRequestParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.resolveUnbanRequest, [params], {
    successMessage: t(
      params.decision === "approve"
        ? "UNBAN_REQUESTS_APPROVED_TOAST"
        : "UNBAN_REQUESTS_DENIED_TOAST",
    ),
    ...options,
  });
}
