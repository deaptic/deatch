import type { Command, CommandOption } from "./types.ts";

export function optionLabel(option: CommandOption): string {
  return option.required ? option.name : `${option.name}?`;
}

export function commandUsage(command: Command): string {
  return command.options.map((o) => `[${optionLabel(o)}]`).join(" ");
}
