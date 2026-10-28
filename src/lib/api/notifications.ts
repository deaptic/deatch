import { commands } from "../bindings.ts";
import type { SetMentionsBadgeParams } from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

export async function setMentionsBadge(
  params: SetMentionsBadgeParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.setMentionsBadge, [params], {
    silent: true,
    ...options,
  });
}
