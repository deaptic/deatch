import { commands } from "./bindings.ts";
import type { AppStats } from "../lib/types/index.ts";
import { invokeCommand, type InvokeOptions } from "./invoke.ts";

export function getAppStats(options?: InvokeOptions): Promise<AppStats> {
  return invokeCommand(commands.getAppStats, [], options);
}
