import { commands } from "../../bindings.ts";
import type {
  BadgeSet,
  BroadcasterPairParams,
  BroadcasterParams,
  ChatSettings,
  Emote,
  GetRecentMessagesParams,
  GetUserChatColorParams,
  RecentHistory,
  SendChatAnnouncementParams,
  SendChatMessageParams,
  SendMessageResult,
  UpdateChatSettingsParams,
  UpdateUserChatColorParams,
  UserEmote,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";
import { t } from "../../i18n/index.ts";

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
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<BadgeSet[]> {
  return invokeCommand(commands.getChannelChatBadges, [params], options);
}

export async function sendShoutout(
  params: BroadcasterPairParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.sendShoutout, [params], {
    successMessage: t("TOAST_SHOUTOUT_SENT"),
    ...options,
  });
}

export function sendChatMessage(
  params: SendChatMessageParams,
  options?: InvokeOptions,
): Promise<SendMessageResult> {
  return invokeCommand(commands.sendChatMessage, [params], options);
}

export function getRecentMessages(
  params: GetRecentMessagesParams,
  options?: InvokeOptions,
): Promise<RecentHistory> {
  return invokeCommand(commands.getRecentMessages, [params], options);
}

export async function sendChatAnnouncement(
  params: SendChatAnnouncementParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.sendChatAnnouncement, [params], {
    successMessage: t("TOAST_ANNOUNCEMENT_SENT"),
    ...options,
  });
}

export function getChatSettings(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<ChatSettings> {
  return invokeCommand(commands.getChatSettings, [params], options);
}

export async function updateChatSettings(
  params: UpdateChatSettingsParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.updateChatSettings, [params], {
    successMessage: t("TOAST_CHAT_SETTINGS_UPDATED"),
    ...options,
  });
}

export function getUserChatColor(
  params: GetUserChatColorParams,
  options?: InvokeOptions,
): Promise<string | null> {
  return invokeCommand(commands.getUserChatColor, [params], options);
}

export async function updateUserChatColor(
  params: UpdateUserChatColorParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.updateUserChatColor, [params], {
    successMessage: t("TOAST_CHAT_COLOR_UPDATED"),
    ...options,
  });
}
