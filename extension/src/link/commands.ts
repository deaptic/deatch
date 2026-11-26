import { log } from "../shared/log.ts";
import { asRecord, type Loose } from "../shared/record.ts";

export type ChannelCommand = Loose & { channel: string };
type Handler<C> = (command: C) => unknown;

export function createCommandHandler(
  channelCommands: Record<string, Handler<ChannelCommand>>,
  browserCommands: Record<string, Handler<Loose>>,
) {
  return (message: unknown) => {
    const command = asRecord(message);
    const { type, channel } = command;
    if (typeof type !== "string") return;
    const run = (result: unknown) =>
      Promise.resolve(result).catch((error: unknown) => {
        log.warn("command failed", type, error);
      });
    if (Object.hasOwn(browserCommands, type)) {
      void run(browserCommands[type]?.(command));
      return;
    }
    if (!Object.hasOwn(channelCommands, type) || typeof channel !== "string") {
      return;
    }
    void run(
      channelCommands[type]?.({ ...command, channel: channel.toLowerCase() }),
    );
  };
}
