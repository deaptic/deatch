import type { Follow } from "../../types/twitch/channel.ts";
import { invokeCommand, type InvokeOptions, type PaginatedResponse } from "../utils.ts";

export type { Follow } from "../../types/twitch/channel.ts";

export type GetChannelFollowersParams = {
  broadcasterId: string;
  userId?: string;
  first?: number;
  after?: string;
};

export function getChannelFollowers(
  params: GetChannelFollowersParams,
  options?: InvokeOptions,
): Promise<PaginatedResponse<Follow>> {
  return invokeCommand("get_channel_followers", params, options);
}

export type GetFollowedChannelsParams = {
  userId: string;
  broadcasterId?: string;
};

export function getFollowedChannels(
  params: GetFollowedChannelsParams,
  options?: InvokeOptions,
): Promise<Follow[]> {
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
  return invokeCommand("modify_channel_information", params, { successMessage: "Channel updated", ...options });
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
  return invokeCommand("start_commercial", params, { successMessage: "Commercial started", ...options });
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
