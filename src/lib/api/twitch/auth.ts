import { commands } from "../../bindings.ts";
import type { DcfAuthResponse, User } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function getDeviceCode(
  options?: InvokeOptions,
): Promise<DcfAuthResponse> {
  return invokeCommand(commands.getDeviceCode, [], options);
}

export async function revokeSession(options?: InvokeOptions): Promise<void> {
  await invokeCommand(commands.revokeSession, [], options);
}

export function restoreSession(options?: InvokeOptions): Promise<User | null> {
  return invokeCommand(commands.restoreSession, [], options);
}
