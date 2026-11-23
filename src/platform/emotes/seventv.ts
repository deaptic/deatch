import { commands } from "../bindings.ts";
import type {
  BroadcasterParams,
  ChannelResult,
  EmoteEntry,
} from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function seventvGetGlobalEmotes(
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand(commands.seventvGetGlobalEmotes, [], options);
}

export function seventvGetChannelEmotes(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<ChannelResult> {
  return invokeCommand(commands.seventvGetChannelEmotes, [params], options);
}
