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

export type GetFollowedChannelsParams = {
  userId: string;
  broadcasterId?: string;
};

export type FollowedBroadcaster = {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  followed_at: string;
};

export function getFollowedChannels(
  params: GetFollowedChannelsParams,
  options?: InvokeOptions,
): Promise<FollowedBroadcaster[]> {
  return invokeCommand("get_followed_channels", params, options);
}

export type ModifyChannelInformationParams = {
  broadcasterId: string;
  title?: string;
};

export function modifyChannelInformation(
  params: ModifyChannelInformationParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("modify_channel_information", params, options);
}

export type CommercialLength = 30 | 60 | 90 | 120 | 150 | 180;

export type StartCommercialParams = {
  broadcasterId: string;
  length: CommercialLength;
};

export function startCommercial(
  params: StartCommercialParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("start_commercial", params, options);
}
