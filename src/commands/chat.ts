import { addToast } from "../state/toasts";
import { fetchAllPages, invokeCommand, type InvokeOptions, type Paginated } from "./utils";

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

export async function getAllUserEmotes(
  params: GetUserEmotesParams = {},
): Promise<GetUserEmotesResponse["data"]> {
  return fetchAllPages("get_user_emotes", (after, options) =>
    getUserEmotes({ ...params, after }, options),
  );
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
