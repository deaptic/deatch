import { commands } from "../../bindings.ts";
import type { BroadcasterLoginParams, EmoteEntry } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function ffzGetGlobalEmotes(
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand(commands.ffzGetGlobalEmotes, [], options);
}

export function ffzGetChannelEmotes(
  params: BroadcasterLoginParams,
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand(commands.ffzGetChannelEmotes, [params], options);
}
