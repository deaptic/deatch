import { commands } from "../../bindings.ts";
import type { CancelRaidParams, StartRaidParams } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export async function startRaid(
  params: StartRaidParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.startRaid, [params], {
    successMessage: "Raid started",
    ...options,
  });
}

export async function cancelRaid(
  params: CancelRaidParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.cancelRaid, [params], {
    successMessage: "Raid cancelled",
    ...options,
  });
}
