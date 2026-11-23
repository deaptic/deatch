import { commands } from "../bindings.ts";
import type { SetChannelsParams } from "../../lib/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export async function setEventsubChannels(
  params: SetChannelsParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.setEventsubChannels, [params], options);
}
