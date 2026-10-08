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
  await invokeCommand(commands.watchRequestState, [], { silent: true });
}

export async function watchFocus(channel: string): Promise<void> {
  await invokeCommand(commands.watchFocus, [{ channel }], { silent: true });
}

export async function watchClose(channel: string): Promise<void> {
  await invokeCommand(commands.watchClose, [{ channel }], { silent: true });
}
