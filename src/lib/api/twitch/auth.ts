import type { DcfAuthResponse } from "../../types/twitch/auth.ts";
import type { User } from "../../types/twitch/user.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function getDeviceCode(
  options?: InvokeOptions,
): Promise<DcfAuthResponse> {
  return invokeCommand<DcfAuthResponse>("get_device_code", undefined, options);
}

export async function revokeSession(options?: InvokeOptions): Promise<void> {
  await invokeCommand<void>("revoke_session", undefined, options);
}

export function restoreSession(options?: InvokeOptions): Promise<User | null> {
  return invokeCommand<User | null>("restore_session", undefined, options);
}
