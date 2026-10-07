import { commands } from "../../bindings.ts";
import type {
  BroadcasterUserParams,
  ChannelInfo,
  GetChannelInformationParams,
  ModifyChannelInformationParams,
  StartCommercialParams,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function getChannelInformation(
  params: GetChannelInformationParams,
  options?: InvokeOptions,
): Promise<ChannelInfo[]> {
  return invokeCommand(commands.getChannelInformation, [params], {
    silent: true,
    ...options,
  });
}

export function getFollowedAt(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<string | null> {
  return invokeCommand(commands.getFollowedAt, [params], options);
}

export async function modifyChannelInformation(
  params: ModifyChannelInformationParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.modifyChannelInformation, [params], options);
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
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.addChannelVip, [params], {
    successMessage: "VIP added",
    ...options,
  });
}

export async function removeChannelVip(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.removeChannelVip, [params], {
    successMessage: "VIP removed",
    ...options,
  });
}
