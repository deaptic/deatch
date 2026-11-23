import { commands } from "../bindings.ts";
import type {
  BroadcasterLoginParams,
  EmoteEntry,
} from "../../lib/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

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
