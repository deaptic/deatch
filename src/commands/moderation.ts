import { fetchAllPages, invokeCommand, type InvokeOptions, type Paginated } from "./utils";

export type DeleteChatMessagesParams = {
  broadcasterId: string;
  messageId?: string | null;
};
export type DeleteChatMessagesResponse = void;

export function deleteChatMessages(
  params: DeleteChatMessagesParams,
  options?: InvokeOptions,
): Promise<DeleteChatMessagesResponse> {
  return invokeCommand("delete_chat_messages", params, options);
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
  return invokeCommand("ban_user", params, options);
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

export async function getAllModeratedChannels(): Promise<
  GetModeratedChannelsResponse["data"]
> {
  return fetchAllPages("get_moderated_channels", (after, options) =>
    getModeratedChannels({ after }, options),
  );
}
