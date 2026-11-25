import { commands } from "./bindings.ts";
import type { PublishParams, RetainParams } from "../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "./invoke.ts";

export async function widgetsPublish(
  params: PublishParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.widgetsPublish, [params], options);
}

export async function widgetsRetain(
  params: RetainParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.widgetsRetain, [params], options);
}

export function widgetsAddress(options?: InvokeOptions): Promise<string> {
  return invokeCommand(commands.widgetsAddress, [], options);
}
