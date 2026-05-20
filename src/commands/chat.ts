import { addToast } from "../state/toasts";
import type { RawChatMessage } from "../types";
import { invokeCommand, type InvokeOptions, type Paginated } from "./utils";

export type GetGlobalEmotesResponse = {
  id: string;
  name: string;
  images: { url_1x: string; url_2x: string; url_4x: string };
  format: ("static" | "animated")[];
  scale: ("1.0" | "2.0" | "3.0")[];
  theme_mode: ("light" | "dark")[];
}[];

export function getGlobalEmotes(options?: InvokeOptions): Promise<GetGlobalEmotesResponse> {
  return invokeCommand("get_global_emotes", undefined, options);
}

export type GetUserEmotesParams = {
  broadcasterId?: string;
  after?: string;
};
export type GetUserEmotesResponse = Paginated<{
  id: string;
  name: string;
  emote_type: string;
  emote_set_id: string;
  owner_id: string;
  format: ("static" | "animated")[];
  scale: ("1.0" | "2.0" | "3.0")[];
  theme_mode: ("light" | "dark")[];
}>;

export function getUserEmotes(
  params: GetUserEmotesParams = {},
  options?: InvokeOptions,
): Promise<GetUserEmotesResponse> {
  return invokeCommand("get_user_emotes", params, options);
}

export type GetAllUserEmotesParams = {
  broadcasterId?: string;
};

export function getAllUserEmotes(
  params: GetAllUserEmotesParams = {},
  options?: InvokeOptions,
): Promise<GetUserEmotesResponse["data"]> {
  return invokeCommand("get_all_user_emotes", params, options);
}

/// Streams pages of user emotes back via the `user-emote-page` Tauri event.
/// Resolves when all pages have been emitted. Subscribe to the event in
/// `events.ts` to handle incoming pages.
export function streamUserEmotes(
  params: GetAllUserEmotesParams = {},
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("stream_user_emotes", params, options);
}

export type GetGlobalChatBadgesResponse = {
  set_id: string;
  versions: {
    id: string;
    image_url_1x: string;
    image_url_2x: string;
    image_url_4x: string;
    title: string;
    description: string;
  }[];
}[];

export function getGlobalChatBadges(
  options?: InvokeOptions,
): Promise<GetGlobalChatBadgesResponse> {
  return invokeCommand("get_global_chat_badges", undefined, options);
}

export type GetChannelChatBadgesParams = {
  broadcasterId: string;
};
export type GetChannelChatBadgesResponse = {
  set_id: string;
  versions: {
    id: string;
    image_url_1x: string;
    image_url_2x: string;
    image_url_4x: string;
    title: string;
    description: string;
  }[];
}[];

export function getChannelChatBadges(
  params: GetChannelChatBadgesParams,
  options?: InvokeOptions,
): Promise<GetChannelChatBadgesResponse> {
  return invokeCommand("get_channel_chat_badges", params, options);
}

export type SendShoutoutParams = {
  fromBroadcasterId: string;
  toBroadcasterId: string;
};
export type SendShoutoutResponse = void;

export function sendShoutout(
  params: SendShoutoutParams,
  options?: InvokeOptions,
): Promise<SendShoutoutResponse> {
  return invokeCommand("send_shoutout", params, options);
}

export type SendChatMessageParams = {
  broadcasterId: string;
  message: string;
  replyParentMessageId?: string | null;
};
type SendChatMessageRawResponse = {
  message_id: string | null;
  is_sent: boolean;
  drop_reason: { code: string; message: string } | null;
};
export type SendChatMessageResponse = boolean;

export async function sendChatMessage(
  params: SendChatMessageParams,
  options?: InvokeOptions,
): Promise<SendChatMessageResponse> {
  try {
    const res = await invokeCommand<SendChatMessageRawResponse>(
      "send_chat_message",
      params,
      options,
    );
    if (!res.is_sent) {
      addToast(res.drop_reason?.message ?? "Message dropped", "error");
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
export type GetRecentMessagesResponse = (RawChatMessage & { timestamp_ms: number })[];

export function getRecentMessages(
  params: GetRecentMessagesParams,
  options?: InvokeOptions,
): Promise<GetRecentMessagesResponse> {
  return invokeCommand("get_recent_messages", params, options);
}

export type AnnouncementColor = "primary" | "blue" | "green" | "orange" | "purple";

export type SendChatAnnouncementParams = {
  broadcasterId: string;
  message: string;
  color?: AnnouncementColor;
};

export function sendChatAnnouncement(
  params: SendChatAnnouncementParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("send_chat_announcement", params, options);
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
  return invokeCommand("update_chat_settings", params, options);
}

export type NamedUserColor =
  | "blue" | "blue_violet" | "cadet_blue" | "chocolate" | "coral" | "dodger_blue"
  | "firebrick" | "golden_rod" | "green" | "hot_pink" | "orange_red" | "red"
  | "sea_green" | "spring_green" | "yellow_green";

export type UpdateUserChatColorParams = { color: NamedUserColor };

export function updateUserChatColor(
  params: UpdateUserChatColorParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("update_user_chat_color", params, options);
}
