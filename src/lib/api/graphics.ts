import { commands } from "../bindings.ts";
import { invokeCommand } from "./utils.ts";

export async function setHardwareAcceleration(enabled: boolean): Promise<void> {
  await invokeCommand(commands.setHardwareAcceleration, [{ enabled }], {
    silent: true,
  });
}
