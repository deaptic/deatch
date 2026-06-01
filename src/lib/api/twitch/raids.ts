import { invokeCommand, type InvokeOptions } from "../utils";

export type StartRaidParams = {
  fromBroadcasterId: string;
  toBroadcasterId: string;
};

export function startRaid(
  params: StartRaidParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("start_raid", params, { successMessage: "Raid started", ...options });
}

export type CancelRaidParams = {
  broadcasterId: string;
};

export function cancelRaid(
  params: CancelRaidParams,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("cancel_raid", params, { successMessage: "Raid cancelled", ...options });
}
