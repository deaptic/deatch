import { commands, type Compressor } from "../bindings.ts";
import { invokeCommand } from "./utils.ts";

export async function linkSetMuted(
  channel: string,
  muted: boolean,
): Promise<void> {
  await invokeCommand(commands.linkSetMuted, [{ channel, muted }], {
    silent: true,
  });
}

export async function linkSetAudio(
  enabled: boolean,
  compressor: Compressor,
  gains: Record<string, number>,
): Promise<void> {
  await invokeCommand(
    commands.linkSetAudio,
    [{ enabled, compressor, gains }],
    { silent: true },
  );
}

export async function linkRequestState(): Promise<void> {
  await invokeCommand(commands.linkRequestState, [], { silent: true });
}

export async function linkFocus(channel: string): Promise<void> {
  await invokeCommand(commands.linkFocus, [{ channel }], { silent: true });
}

export async function linkClose(channel: string): Promise<void> {
  await invokeCommand(commands.linkClose, [{ channel }], { silent: true });
}
