import type { EmoteEntry } from "../../types/external/emote.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function ffzGetGlobalEmotes(
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand("ffz_get_global_emotes", undefined, options);
}

export type FfzGetChannelEmotesParams = {
  channelLogin: string;
};

export function ffzGetChannelEmotes(
  params: FfzGetChannelEmotesParams,
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand("ffz_get_channel_emotes", params, options);
}
