import { commands } from "./bindings.ts";
import type { SetMentionsBadgeParams } from "../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "./invoke.ts";

export async function setMentionsBadge(
  params: SetMentionsBadgeParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.setMentionsBadge, [params], options);
}
