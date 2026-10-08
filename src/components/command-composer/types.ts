export type CommandContext = {
  broadcasterId: string;
  broadcasterLogin: string;
  openUserCard: (userId: string) => void;
};

export type OptionSuggestion = { id: string; label: string; image?: string };

type OptionBase = {
  name: string;
  description: string;
  required?: boolean;
  default?: unknown;
  hint?: string;
};

export type DurationOption = OptionBase & {
  type: "duration";
  // Inclusive bounds in seconds.
  min?: number;
  max?: number;
};

export type CommandOption =
  | (OptionBase & { type: "user" | "string" })
  | DurationOption
  | (OptionBase & { type: "enum"; values: string[] })
  | (OptionBase & {
    type: "search";
    search: (query: string) => Promise<OptionSuggestion[]>;
  });

export type OptionType = CommandOption["type"];

export type CommandRole = "broadcaster" | "mod" | "regular";

export type Command = {
  name: string;
  aliases?: string[];
  description: string;
  role: CommandRole;
  options: CommandOption[];
  execute: (
    values: Record<string, unknown>,
    ctx: CommandContext,
  ) => Promise<void>;
};
