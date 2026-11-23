import { commands } from "../../bindings.ts";
import type { BroadcasterParams, Goal } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function getGoals(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<Goal[]> {
  return invokeCommand(commands.getGoals, [params], options);
}
