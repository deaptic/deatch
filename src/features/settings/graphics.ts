import { setHardwareAcceleration as save } from "../../platform/graphics.ts";
import type { InvokeOptions } from "../../platform/invoke.ts";
import { setAdvancedHardwareAcceleration } from "../preferences/index.ts";
import { exit } from "../exit/index.ts";

export async function setHardwareAcceleration(
  enabled: boolean,
  options?: InvokeOptions,
): Promise<void> {
  await save({ enabled }, options);
  setAdvancedHardwareAcceleration(enabled);
  await exit.relaunch(options);
}
