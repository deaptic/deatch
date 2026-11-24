import { commands } from "../bindings.ts";
import type {
  BroadcasterParams,
  BroadcasterUserParams,
  ChannelDetails,
  ChannelInfo,
  ContentLabel,
  FollowersPage,
  GetFollowersParams,
  GetContentLabelsParams,
  GetChannelInformationParams,
  ModifyChannelInformationParams,
  StartCommercialParams,
} from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";
import { t } from "../../shared/i18n/index.ts";

export function getChannelInformation(
  params: GetChannelInformationParams,
  options?: InvokeOptions,
): Promise<ChannelInfo[]> {
  return invokeCommand(commands.getChannelInformation, [params], options);
}

export function getFollowedAt(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<string | null> {
  return invokeCommand(commands.getFollowedAt, [params], options);
}

export function getFollowers(
  params: GetFollowersParams,
  options?: InvokeOptions,
): Promise<FollowersPage> {
  return invokeCommand(commands.getFollowers, [params], options);
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
    successMessage: t("HEADER_AD_STARTED_TOAST"),
    ...options,
  });
}

export async function addChannelModerator(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.addChannelModerator, [params], {
    successMessage: t("COMMAND_MOD_ADDED_TOAST"),
    ...options,
  });
}

export async function removeChannelModerator(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.removeChannelModerator, [params], {
    successMessage: t("COMMAND_MOD_REMOVED_TOAST"),
    ...options,
  });
}

export async function addChannelVip(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.addChannelVip, [params], {
    successMessage: t("COMMAND_VIP_ADDED_TOAST"),
    ...options,
  });
}

export async function removeChannelVip(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.removeChannelVip, [params], {
    successMessage: t("COMMAND_VIP_REMOVED_TOAST"),
    ...options,
  });
}

export function getChannelDetails(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<ChannelDetails | null> {
  return invokeCommand(commands.getChannelDetails, [params], options);
}

export function getContentLabels(
  params: GetContentLabelsParams,
  options?: InvokeOptions,
): Promise<ContentLabel[]> {
  return invokeCommand(commands.getContentLabels, [params], options);
}
