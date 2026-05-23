import { invokeCommand, type InvokeOptions } from "../utils";

export type SeventvWatchEmoteSetParams = {
  emoteSetId: string | null;
};

export function seventvWatchEmoteSet(
  params: SeventvWatchEmoteSetParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("seventv_watch_emote_set", params, options);
}
