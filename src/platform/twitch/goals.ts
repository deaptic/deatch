import { commands } from "../bindings.ts";
import type { BroadcasterParams, Goal } from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function getGoals(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<Goal[]> {
  return invokeCommand(commands.getGoals, [params], options);
}
