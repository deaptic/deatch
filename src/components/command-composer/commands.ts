import type { Command } from "./types.ts";
import { twitchCommands } from "./definitions/twitch.ts";
import { deatchCommands } from "./definitions/deatch.ts";

export const commands: Command[] = [...twitchCommands, ...deatchCommands];
