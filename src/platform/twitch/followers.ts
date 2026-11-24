import { commands } from "../bindings.ts";
import type { BroadcasterParams } from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function getFollowerCount(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<number | null> {
  return invokeCommand(commands.getFollowerCount, [params], options);
}
