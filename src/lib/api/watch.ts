import { commands } from "../bindings.ts";
import { invokeCommand } from "./utils.ts";

export async function watchSetMuted(
  channel: string,
  muted: boolean,
): Promise<void> {
  await invokeCommand(commands.watchSetMuted, [{ channel, muted }], {
    silent: true,
  });
}

export async function watchRequestState(): Promise<void> {
  try {
    await invokeCommand(commands.watchRequestState, [], { silent: true });
  } catch {}
}
