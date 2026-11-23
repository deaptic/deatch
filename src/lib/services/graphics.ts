import { setHardwareAcceleration as save } from "../../platform/graphics.ts";
import type { InvokeOptions } from "../../platform/invoke.ts";
import { setAdvancedHardwareAcceleration } from "../stores/preferences.ts";
import * as exit from "./exit.ts";

export async function setHardwareAcceleration(
  enabled: boolean,
  options?: InvokeOptions,
): Promise<void> {
  await save({ enabled }, options);
  setAdvancedHardwareAcceleration(enabled);
  await exit.relaunch(options);
}
