import { commands } from "../../bindings.ts";
import { appendLocalNotice } from "../../stores/feeds.ts";
import { addToast } from "../../stores/toasts.ts";
import type {
  BadgeSet,
  Emote,
  GetChannelChatBadgesParams,
  GetRecentMessagesParams,
  RecentMessage,
  SendChatAnnouncementParams,
  SendChatMessageParams,
  SendShoutoutParams,
  UpdateChatSettingsParams,
  UpdateUserChatColorParams,
  UserEmote,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export type {
  AnnouncementColor,
  BadgeSet,
  ChatColor,
  Emote,
  SendMessageResult,
  UserEmote,
} from "../../types/index.ts";

export type SendOutcome = "sent" | "held" | "failed";

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

export async function sendChatMessage(
  params: SendChatMessageParams,
  options?: InvokeOptions,
): Promise<SendOutcome> {
  try {
    const res = await invokeCommand(
      commands.sendChatMessage,
      [params],
      options,
    );
    if (res.isSent) return "sent";
    if (res.held) {
      appendLocalNotice(
        params.broadcasterId,
        "Your message is with the mods for review.",
      );
      return "held";
    }
    addToast(res.dropReason ?? "Message dropped", "error");
    return "failed";
  } catch {
    return "failed";
  }
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
