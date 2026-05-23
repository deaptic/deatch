import type { EmoteEntry } from "../../types/external/emote";
import type { ChannelResult } from "../../types/external/seventv";
import { invokeCommand, type InvokeOptions } from "../utils";

export function seventvGetGlobalEmotes(options?: InvokeOptions): Promise<EmoteEntry[]> {
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
