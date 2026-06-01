import type { Ban, BannedUser } from "../../types/twitch/moderation.ts";
import type { UserRef } from "../../types/twitch/user.ts";
import { invokeCommand, type InvokeOptions, type PaginatedResponse } from "../utils.ts";

export type { Ban, BannedUser } from "../../types/twitch/moderation.ts";

export type DeleteChatMessagesParams = {
  broadcasterId: string;
  messageId?: string | null;
};

export function deleteChatMessages(
  params: DeleteChatMessagesParams,
  options?: InvokeOptions,
): Promise<void> {
  const successMessage = params.messageId ? "Message deleted" : "Chat cleared";
  return invokeCommand("delete_chat_messages", params, { successMessage, ...options });
}

export type BanUserParams = {
  broadcasterId: string;
  userId: string;
  duration?: number | null;
  reason?: string | null;
};

export function banUser(
  params: BanUserParams,
  options?: InvokeOptions,
): Promise<Ban> {
  const successMessage = params.duration ? "User timed out" : "User banned";
  return invokeCommand("ban_user", params, { successMessage, ...options });
}

export type UnbanUserParams = {
  broadcasterId: string;
  userId: string;
};

export function unbanUser(
  params: UnbanUserParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("unban_user", params, { successMessage: "User unbanned", ...options });
}

export type GetBannedUsersParams = {
  broadcasterId: string;
  userId?: string;
  first?: number;
  after?: string;
};

export function getBannedUsers(
  params: GetBannedUsersParams,
  options?: InvokeOptions,
): Promise<PaginatedResponse<BannedUser>> {
  return invokeCommand("get_banned_users", params, options);
}

export type GetModeratorsParams = {
  broadcasterId: string;
  first?: number;
  after?: string;
};

export function getModerators(
  params: GetModeratorsParams,
  options?: InvokeOptions,
): Promise<PaginatedResponse<UserRef>> {
  return invokeCommand("get_moderators", params, options);
}

export type GetModeratedChannelsParams = {
  first?: number;
  after?: string;
};

export function getModeratedChannels(
  params: GetModeratedChannelsParams = {},
  options?: InvokeOptions,
): Promise<PaginatedResponse<UserRef>> {
  return invokeCommand("get_moderated_channels", params, options);
}

export type WarnUserParams = {
  broadcasterId: string;
  userId: string;
  reason: string;
};

export function warnUser(
  params: WarnUserParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("warn_user", params, { successMessage: "User warned", ...options });
}

export type ManageHeldAutomodMessageParams = {
  msgId: string;
};

export function approveHeldAutomodMessage(
  params: ManageHeldAutomodMessageParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("approve_held_automod_message", params, {
    successMessage: "Message approved",
    ...options,
  });
}

export function denyHeldAutomodMessage(
  params: ManageHeldAutomodMessageParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("deny_held_automod_message", params, {
    successMessage: "Message denied",
    ...options,
  });
}
