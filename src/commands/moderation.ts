import { invokeCommand, type InvokeOptions, type Paginated } from "./utils";

export type DeleteChatMessagesParams = {
  broadcasterId: string;
  messageId?: string | null;
};
export type DeleteChatMessagesResponse = void;

export function deleteChatMessages(
  params: DeleteChatMessagesParams,
  options?: InvokeOptions,
): Promise<DeleteChatMessagesResponse> {
  const successMessage = params.messageId ? "Message deleted" : "Chat cleared";
  return invokeCommand("delete_chat_messages", params, { successMessage, ...options });
}

export type BanUserParams = {
  broadcasterId: string;
  userId: string;
  duration?: number | null;
  reason?: string | null;
};
export type BanUserResponse = {
  broadcaster_id: string;
  moderator_id: string;
  user_id: string;
  created_at: string;
  end_time: string | null;
};

export function banUser(
  params: BanUserParams,
  options?: InvokeOptions,
): Promise<BanUserResponse> {
  const successMessage = params.duration ? "User timed out" : "User banned";
  return invokeCommand("ban_user", params, { successMessage, ...options });
}

export type UnbanUserParams = {
  broadcasterId: string;
  userId: string;
};
export type UnbanUserResponse = void;

export function unbanUser(
  params: UnbanUserParams,
  options?: InvokeOptions,
): Promise<UnbanUserResponse> {
  return invokeCommand("unban_user", params, { successMessage: "User unbanned", ...options });
}

export type GetBannedUsersParams = {
  broadcasterId: string;
  userId?: string;
  first?: number;
  after?: string;
};
export type GetBannedUsersResponse = Paginated<{
  user_id: string;
  user_login: string;
  user_name: string;
  expires_at: string | null;
  created_at: string;
  reason: string;
  moderator_id: string;
  moderator_login: string;
  moderator_name: string;
}>;

export function getBannedUsers(
  params: GetBannedUsersParams,
  options?: InvokeOptions,
): Promise<GetBannedUsersResponse> {
  return invokeCommand("get_banned_users", params, options);
}

export type GetAllBannedUsersParams = {
  broadcasterId: string;
  userId?: string;
};

export function getAllBannedUsers(
  params: GetAllBannedUsersParams,
  options?: InvokeOptions,
): Promise<GetBannedUsersResponse["data"]> {
  return invokeCommand("get_all_banned_users", params, options);
}

export type GetModeratorsParams = {
  broadcasterId: string;
  first?: number;
  after?: string;
};
export type GetModeratorsResponse = Paginated<{
  user_id: string;
  user_login: string;
  user_name: string;
}>;

export function getModerators(
  params: GetModeratorsParams,
  options?: InvokeOptions,
): Promise<GetModeratorsResponse> {
  return invokeCommand("get_moderators", params, options);
}

export type GetAllModeratorsParams = {
  broadcasterId: string;
};

export function getAllModerators(
  params: GetAllModeratorsParams,
  options?: InvokeOptions,
): Promise<GetModeratorsResponse["data"]> {
  return invokeCommand("get_all_moderators", params, options);
}

export type GetModeratedChannelsParams = {
  first?: number;
  after?: string;
};
export type GetModeratedChannelsResponse = Paginated<{
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
}>;

export function getModeratedChannels(
  params: GetModeratedChannelsParams = {},
  options?: InvokeOptions,
): Promise<GetModeratedChannelsResponse> {
  return invokeCommand("get_moderated_channels", params, options);
}

export function getAllModeratedChannels(
  options?: InvokeOptions,
): Promise<GetModeratedChannelsResponse["data"]> {
  return invokeCommand("get_all_moderated_channels", undefined, options);
}

export type AddChannelVipParams = {
  broadcasterId: string;
  userId: string;
};

export function addChannelVip(
  params: AddChannelVipParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("add_channel_vip", params, { successMessage: "VIP added", ...options });
}

export type RemoveChannelVipParams = {
  broadcasterId: string;
  userId: string;
};

export function removeChannelVip(
  params: RemoveChannelVipParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("remove_channel_vip", params, { successMessage: "VIP removed", ...options });
}

export type StartRaidParams = {
  fromBroadcasterId: string;
  toBroadcasterId: string;
};

export function startRaid(
  params: StartRaidParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("start_raid", params, { successMessage: "Raid started", ...options });
}

export type CancelRaidParams = {
  broadcasterId: string;
};

export function cancelRaid(
  params: CancelRaidParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("cancel_raid", params, { successMessage: "Raid cancelled", ...options });
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
