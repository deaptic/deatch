import { commands } from "../bindings.ts";
import type { SetHardwareAccelerationParams } from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

export async function setHardwareAcceleration(
  params: SetHardwareAccelerationParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.setHardwareAcceleration, [params], {
    silent: true,
    ...options,
  });
}
