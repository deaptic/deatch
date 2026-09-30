import { commands } from "../../bindings.ts";
import type { EmoteSetParams } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export async function seventvSubscribeEmoteSet(
  params: EmoteSetParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.seventvSubscribeEmoteSet, [params], options);
}

export async function seventvUnsubscribeEmoteSet(
  params: EmoteSetParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.seventvUnsubscribeEmoteSet, [params], options);
}
