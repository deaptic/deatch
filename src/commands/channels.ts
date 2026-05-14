import { invokeCommand, type InvokeOptions, type Paginated } from "./utils";

export type GetChannelFollowersParams = {
  broadcasterId: string;
  userId?: string;
  first?: number;
  after?: string;
};
export type GetChannelFollowersResponse = Paginated<{
  user_id: string;
  user_login: string;
  user_name: string;
  followed_at: string;
}>;

export function getChannelFollowers(
  params: GetChannelFollowersParams,
  options?: InvokeOptions,
): Promise<GetChannelFollowersResponse> {
  return invokeCommand("get_channel_followers", params, options);
}

export type GetAllChannelFollowersParams = {
  broadcasterId: string;
  userId?: string;
};

export function getAllChannelFollowers(
  params: GetAllChannelFollowersParams,
  options?: InvokeOptions,
): Promise<GetChannelFollowersResponse["data"]> {
  return invokeCommand("get_all_channel_followers", params, options);
}
