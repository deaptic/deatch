import { commands } from "../bindings.ts";
import type { AppStats } from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

export function getAppStats(options?: InvokeOptions): Promise<AppStats> {
  return invokeCommand(commands.getAppStats, [], { silent: true, ...options });
}
