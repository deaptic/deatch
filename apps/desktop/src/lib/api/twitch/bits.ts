import { commands } from "../../bindings.ts";
import type { BroadcasterParams, Cheermote } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function getCheermotes(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<Cheermote[]> {
  return invokeCommand(commands.getCheermotes, [params], options);
}
