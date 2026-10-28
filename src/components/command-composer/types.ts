import type { MessageKey } from "../../lib/i18n/index.ts";

export type CommandContext = {
  broadcasterId: string;
  openUserCard: (userId: string) => void;
};

export type OptionSuggestion = { id: string; label: string; image?: string };

type OptionBase = {
  name: string;
  description: MessageKey;
  required?: true;
  hint?: MessageKey;
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
      /// Rejects on failure, which the composer shows on the slot; call the
      /// api silently.
      search: (query: string) => Promise<OptionSuggestion[]>;
    });

export type CommandRole = "broadcaster" | "mod" | "regular";

export type Command = {
  name: string;
  aliases?: string[];
  description: MessageKey;
  role: CommandRole;
  options: CommandOption[];
  execute: (
    values: Record<string, unknown>,
    ctx: CommandContext,
  ) => Promise<void>;
};
