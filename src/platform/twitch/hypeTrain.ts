import { commands } from "../bindings.ts";
import type { BroadcasterParams, HypeTrain } from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function getHypeTrain(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<HypeTrain | null> {
  return invokeCommand(commands.getHypeTrain, [params], options);
}
