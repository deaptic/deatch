import { invokeCommand, type InvokeOptions } from "../utils";

export type SeventvEmoteSetParams = {
  emoteSetId: string;
};

export function seventvSubscribeEmoteSet(
  params: SeventvEmoteSetParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("seventv_subscribe_emote_set", params, options);
}

export function seventvUnsubscribeEmoteSet(
  params: SeventvEmoteSetParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("seventv_unsubscribe_emote_set", params, options);
}
