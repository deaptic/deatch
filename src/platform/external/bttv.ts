import { commands } from "../bindings.ts";
import type { BroadcasterParams, EmoteEntry } from "../../lib/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function bttvGetGlobalEmotes(
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand(commands.bttvGetGlobalEmotes, [], options);
}

export function bttvGetChannelEmotes(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand(commands.bttvGetChannelEmotes, [params], options);
}
