import { commands } from "./bindings.ts";
import type { SetTaskbarBadgeParams } from "../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "./invoke.ts";

export async function setTaskbarBadge(
  params: SetTaskbarBadgeParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.setTaskbarBadge, [params], options);
}

export async function flashTaskbar(options?: InvokeOptions): Promise<void> {
  await invokeCommand(commands.flashTaskbar, [], options);
}
