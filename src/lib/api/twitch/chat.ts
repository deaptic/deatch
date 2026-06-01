import { addToast } from "../../stores/toasts.ts";
import type { RecentMessage } from "../../types/external/robotty.ts";
import type {
  BadgeSet,
  Emote,
  SendMessageResult,
  UserEmote,
} from "../../types/twitch/chat.ts";
import {
  invokeCommand,
  type InvokeOptions,
  type PaginatedResponse,
} from "../utils.ts";

export type {
  BadgeSet,
  Emote,
  SendMessageResult,
  UserEmote,
} from "../../types/twitch/chat.ts";

export function getGlobalEmotes(options?: InvokeOptions): Promise<Emote[]> {
  return invokeCommand("get_global_emotes", undefined, options);
}

export type GetUserEmotesParams = {
  broadcasterId?: string;
  after?: string;
};

export function getUserEmotes(
  params: GetUserEmotesParams = {},
  options?: InvokeOptions,
): Promise<PaginatedResponse<UserEmote>> {
  return invokeCommand("get_user_emotes", params, options);
}

export function getGlobalChatBadges(
  options?: InvokeOptions,
): Promise<BadgeSet[]> {
  return invokeCommand("get_global_chat_badges", undefined, options);
}

export type GetChannelChatBadgesParams = {
  broadcasterId: string;
};

export function getChannelChatBadges(
  params: GetChannelChatBadgesParams,
  options?: InvokeOptions,
): Promise<BadgeSet[]> {
  return invokeCommand("get_channel_chat_badges", params, options);
}

export type SendShoutoutParams = {
  fromBroadcasterId: string;
  toBroadcasterId: string;
};

export function sendShoutout(
  params: SendShoutoutParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("send_shoutout", params, {
    successMessage: "Shoutout sent",
    ...options,
  });
}

export type SendChatMessageParams = {
  broadcasterId: string;
  message: string;
  replyParentMessageId?: string | null;
};

export async function sendChatMessage(
  params: SendChatMessageParams,
  options?: InvokeOptions,
): Promise<boolean> {
  try {
    const res = await invokeCommand<SendMessageResult>(
      "send_chat_message",
      params,
      options,
    );
    if (!res.isSent) {
      addToast(res.dropReason ?? "Message dropped", "error");
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export type GetRecentMessagesParams = {
  channelLogin: string;
  limit?: number;
};

export function getRecentMessages(
  params: GetRecentMessagesParams,
  options?: InvokeOptions,
): Promise<RecentMessage[]> {
  return invokeCommand("get_recent_messages", params, options);
}

export type AnnouncementColor =
  | "primary"
  | "blue"
  | "green"
  | "orange"
  | "purple";

export type SendChatAnnouncementParams = {
  broadcasterId: string;
  message: string;
  color?: AnnouncementColor;
};

export function sendChatAnnouncement(
  params: SendChatAnnouncementParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("send_chat_announcement", params, {
    successMessage: "Announcement sent",
    ...options,
  });
}

export type UpdateChatSettingsParams = {
  broadcasterId: string;
  emoteMode?: boolean;
  followerMode?: boolean;
  followerModeDuration?: number;
  slowMode?: boolean;
  slowModeWaitTime?: number;
  subscriberMode?: boolean;
  uniqueChatMode?: boolean;
};

export function updateChatSettings(
  params: UpdateChatSettingsParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("update_chat_settings", params, {
    successMessage: "Chat settings updated",
    ...options,
  });
}

export type NamedUserColor =
  | "blue"
  | "blue_violet"
  | "cadet_blue"
  | "chocolate"
  | "coral"
  | "dodger_blue"
  | "firebrick"
  | "golden_rod"
  | "green"
  | "hot_pink"
  | "orange_red"
  | "red"
  | "sea_green"
  | "spring_green"
  | "yellow_green";

export type UpdateUserChatColorParams = { color: NamedUserColor };

export function updateUserChatColor(
  params: UpdateUserChatColorParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("update_user_chat_color", params, {
    successMessage: "Chat color updated",
    ...options,
  });
}
