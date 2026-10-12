import { commands } from "../bindings.ts";
import type { WatchParams } from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

export async function connect(options?: InvokeOptions): Promise<void> {
  await invokeCommand(commands.deatchConnect, [], options);
}

export async function disconnect(options?: InvokeOptions): Promise<void> {
  await invokeCommand(commands.deatchDisconnect, [], options);
}

export async function watch(
  params: WatchParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.deatchWatch, [params], options);
}
