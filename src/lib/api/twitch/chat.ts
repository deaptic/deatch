import { commands } from "../../bindings.ts";
import type {
  BadgeSet,
  ChatSettings,
  Emote,
  GetChannelChatBadgesParams,
  GetChatSettingsParams,
  GetRecentMessagesParams,
  RecentMessage,
  SendChatAnnouncementParams,
  SendChatMessageParams,
  SendMessageResult,
  SendShoutoutParams,
  UpdateChatSettingsParams,
  UpdateUserChatColorParams,
  UserEmote,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function getGlobalEmotes(options?: InvokeOptions): Promise<Emote[]> {
  return invokeCommand(commands.getGlobalEmotes, [], options);
}

export function getUserEmotes(options?: InvokeOptions): Promise<UserEmote[]> {
  return invokeCommand(commands.getUserEmotes, [], options);
}

export function getGlobalChatBadges(
  options?: InvokeOptions,
): Promise<BadgeSet[]> {
  return invokeCommand(commands.getGlobalChatBadges, [], options);
}

export function getChannelChatBadges(
  params: GetChannelChatBadgesParams,
  options?: InvokeOptions,
): Promise<BadgeSet[]> {
  return invokeCommand(commands.getChannelChatBadges, [params], options);
}

export async function sendShoutout(
  params: SendShoutoutParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.sendShoutout, [params], {
    successMessage: "Shoutout sent",
    ...options,
  });
}

export function postChatMessage(
  params: SendChatMessageParams,
  options?: InvokeOptions,
): Promise<SendMessageResult> {
  return invokeCommand(commands.sendChatMessage, [params], options);
}

export function getRecentMessages(
  params: GetRecentMessagesParams,
  options?: InvokeOptions,
): Promise<RecentMessage[]> {
  return invokeCommand(commands.getRecentMessages, [params], options);
}

export async function sendChatAnnouncement(
  params: SendChatAnnouncementParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.sendChatAnnouncement, [params], {
    successMessage: "Announcement sent",
    ...options,
  });
}

export function getChatSettings(
  params: GetChatSettingsParams,
  options?: InvokeOptions,
): Promise<ChatSettings> {
  return invokeCommand(commands.getChatSettings, [params], options);
}

export async function updateChatSettings(
  params: UpdateChatSettingsParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.updateChatSettings, [params], {
    successMessage: "Chat settings updated",
    ...options,
  });
}

export async function updateUserChatColor(
  params: UpdateUserChatColorParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.updateUserChatColor, [params], {
    successMessage: "Chat color updated",
    ...options,
  });
}
