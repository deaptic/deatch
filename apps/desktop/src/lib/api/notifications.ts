import { commands } from "../bindings.ts";
import { invokeCommand } from "./utils.ts";

export async function setMentionsBadge(
  count: number,
  iconBytes: number[] | null,
): Promise<void> {
  await invokeCommand(commands.setMentionsBadge, [{ count, iconBytes }], {
    silent: true,
  });
}
