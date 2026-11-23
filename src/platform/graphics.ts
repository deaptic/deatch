import { commands } from "./bindings.ts";
import type { SetHardwareAccelerationParams } from "../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "./invoke.ts";

export async function setHardwareAcceleration(
  params: SetHardwareAccelerationParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.setHardwareAcceleration, [params], options);
}
