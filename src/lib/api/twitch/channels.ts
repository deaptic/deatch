import { commands } from "../../bindings.ts";
import type {
  ChannelInfo,
  ChannelVipParams,
  Follow,
  GetChannelFollowersParams,
  GetChannelInformationParams,
  GetFollowedChannelsParams,
  ModifyChannelInformationParams,
  PaginatedResponse,
  StartCommercialParams,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export type { ChannelInfo, Follow } from "../../types/index.ts";

export function getChannelInformation(
  params: GetChannelInformationParams,
  options?: InvokeOptions,
): Promise<ChannelInfo[]> {
  return invokeCommand(commands.getChannelInformation, [params], {
    silent: true,
    ...options,
  });
}

export function getChannelFollowers(
  params: GetChannelFollowersParams,
  options?: InvokeOptions,
): Promise<PaginatedResponse<Follow>> {
  return invokeCommand(commands.getChannelFollowers, [params], options);
}

export function getFollowedChannels(
  params: GetFollowedChannelsParams,
  options?: InvokeOptions,
): Promise<Follow[]> {
  return invokeCommand(commands.getFollowedChannels, [params], options);
}

export async function modifyChannelInformation(
  params: ModifyChannelInformationParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.modifyChannelInformation, [params], {
    successMessage: "Channel updated",
    ...options,
  });
}

export async function startCommercial(
  params: StartCommercialParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.startCommercial, [params], {
    successMessage: "Commercial started",
    ...options,
  });
}

export async function addChannelVip(
  params: ChannelVipParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.addChannelVip, [params], {
    successMessage: "VIP added",
    ...options,
  });
}

export async function removeChannelVip(
  params: ChannelVipParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.removeChannelVip, [params], {
    successMessage: "VIP removed",
    ...options,
  });
}
