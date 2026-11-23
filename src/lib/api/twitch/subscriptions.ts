import { commands } from "../../bindings.ts";
import type { BroadcasterUserParams, Subscription } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function getSubscription(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<Subscription | null> {
  return invokeCommand(commands.getSubscription, [params], options);
}
