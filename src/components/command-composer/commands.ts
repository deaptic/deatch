import type { Command } from "./types";
import { twitchCommands } from "./definitions/twitch";
import { deatchCommands } from "./definitions/deatch";

export const commands: Command[] = [...twitchCommands, ...deatchCommands];
