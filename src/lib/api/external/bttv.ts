import type { EmoteEntry } from "../../types/external/emote.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function bttvGetGlobalEmotes(options?: InvokeOptions): Promise<EmoteEntry[]> {
  return invokeCommand("bttv_get_global_emotes", undefined, options);
}

export type BttvGetChannelEmotesParams = {
  channelId: string;
};

export function bttvGetChannelEmotes(
  params: BttvGetChannelEmotesParams,
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand("bttv_get_channel_emotes", params, options);
}
