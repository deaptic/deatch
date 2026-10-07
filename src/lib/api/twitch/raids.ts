import { commands } from "../../bindings.ts";
import type {
  BroadcasterPairParams,
  BroadcasterParams,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export async function startRaid(
  params: BroadcasterPairParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.startRaid, [params], {
    successMessage: "Raid started",
    ...options,
  });
}

export async function cancelRaid(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.cancelRaid, [params], {
    successMessage: "Raid cancelled",
    ...options,
  });
}
