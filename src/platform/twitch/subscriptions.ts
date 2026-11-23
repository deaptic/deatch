import { commands } from "../bindings.ts";
import type {
  BroadcasterUserParams,
  Subscription,
} from "../../lib/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function getSubscription(
  params: BroadcasterUserParams,
  options?: InvokeOptions,
): Promise<Subscription | null> {
  return invokeCommand(commands.getSubscription, [params], options);
}
