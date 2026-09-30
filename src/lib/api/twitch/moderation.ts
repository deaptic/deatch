import { commands } from "../../bindings.ts";
import type {
  Ban,
  BannedUser,
  BanUserParams,
  DeleteChatMessagesParams,
  GetBannedUsersParams,
  ManageHeldAutomodMessageParams,
  PaginatedResponse,
  UnbanUserParams,
  UserRef,
  WarnUserParams,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export type { AutomodAction, Ban, BannedUser } from "../../types/index.ts";

export async function deleteChatMessages(
  params: DeleteChatMessagesParams,
  options?: InvokeOptions,
): Promise<void> {
  const successMessage = params.messageId ? "Message deleted" : "Chat cleared";
  await invokeCommand(commands.deleteChatMessages, [params], {
    successMessage,
    ...options,
  });
}

export function banUser(
  params: BanUserParams,
  options?: InvokeOptions,
): Promise<Ban> {
  const successMessage = params.duration ? "User timed out" : "User banned";
  return invokeCommand(commands.banUser, [params], {
    successMessage,
    ...options,
  });
}

export async function unbanUser(
  params: UnbanUserParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.unbanUser, [params], {
    successMessage: "User unbanned",
    ...options,
  });
}

export function getBannedUsers(
  params: GetBannedUsersParams,
  options?: InvokeOptions,
): Promise<PaginatedResponse<BannedUser>> {
  return invokeCommand(commands.getBannedUsers, [params], options);
}

export function getModeratedChannels(
  options?: InvokeOptions,
): Promise<UserRef[]> {
  return invokeCommand(commands.getModeratedChannels, [], options);
}

export async function warnUser(
  params: WarnUserParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.warnUser, [params], {
    successMessage: "User warned",
    ...options,
  });
}

export async function manageHeldAutomodMessage(
  params: ManageHeldAutomodMessageParams,
  options?: InvokeOptions,
): Promise<void> {
  const successMessage = params.action === "allow"
    ? "Message approved"
    : "Message denied";
  await invokeCommand(commands.manageHeldAutomodMessage, [params], {
    successMessage,
    ...options,
  });
}
