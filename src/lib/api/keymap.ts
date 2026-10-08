import { commands } from "../bindings.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

export function readKeymap(options?: InvokeOptions): Promise<string> {
  return invokeCommand(commands.readKeymap, [], options);
}
