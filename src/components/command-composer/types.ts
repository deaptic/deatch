export type CommandContext = {
  broadcasterId: string;
  broadcasterLogin: string;
  openUserCard: (userId: string) => void;
};

export type OptionType = "user" | "string" | "duration" | "enum" | "search";

export type OptionSuggestion = { id: string; label: string; image?: string };

export type CommandOption = {
  name: string;
  description: string;
  type: OptionType;
  required?: boolean;
  default?: unknown;
  hint?: string;
  values?: string[];
  // For `search` options: async provider returning ranked suggestions.
  search?: (query: string) => Promise<OptionSuggestion[]>;
};

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
