import { commands } from "../bindings.ts";
import type { ActivityInput } from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

export async function discordConnect(
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.discordConnect, [], options);
}

export async function discordDisconnect(
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.discordDisconnect, [], options);
}

export async function discordSetActivity(
  params: ActivityInput,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.discordSetActivity, [params], options);
}
