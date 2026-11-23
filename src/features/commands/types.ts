import type { ChannelRole } from "../../lib/utils/roles.ts";
import type { MessageKey } from "../../shared/i18n/index.ts";

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

export type Command = {
  name: string;
  aliases?: string[];
  description: MessageKey;
  role: ChannelRole;
  options: CommandOption[];
  execute: (
    values: Record<string, unknown>,
    ctx: CommandContext,
  ) => Promise<void>;
};
