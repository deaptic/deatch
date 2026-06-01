import type { EmoteEntry } from "../../types/external/emote.ts";
import type { ChannelResult } from "../../types/external/seventv.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function seventvGetGlobalEmotes(
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand("seventv_get_global_emotes", undefined, options);
}

export type SeventvGetChannelEmotesParams = {
  channelId: string;
};

export function seventvGetChannelEmotes(
  params: SeventvGetChannelEmotesParams,
  options?: InvokeOptions,
): Promise<ChannelResult> {
  return invokeCommand("seventv_get_channel_emotes", params, options);
}
