import { commands } from "../../bindings.ts";
import type { SubscribeParams } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export async function subscribe(
  params: SubscribeParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.subscribe, [params], options);
}

export async function unsubscribe(
  params: SubscribeParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.unsubscribe, [params], options);
}
