import { commands } from "../../bindings.ts";
import type { ChannelIdParams, EmoteEntry } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function bttvGetGlobalEmotes(
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand(commands.bttvGetGlobalEmotes, [], options);
}

export function bttvGetChannelEmotes(
  params: ChannelIdParams,
  options?: InvokeOptions,
): Promise<EmoteEntry[]> {
  return invokeCommand(commands.bttvGetChannelEmotes, [params], options);
}
