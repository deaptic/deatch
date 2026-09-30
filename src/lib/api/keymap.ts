import { commands } from "../bindings.ts";
import type { WriteKeymapParams } from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

export function readKeymap(options?: InvokeOptions): Promise<string> {
  return invokeCommand(commands.readKeymap, [], options);
}

export async function writeKeymap(
  params: WriteKeymapParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.writeKeymap, [params], options);
}
