import type { EmoteEntry } from "./emote.ts";

export type ChannelResult = {
  emotes: EmoteEntry[];
  emote_set_id: string | null;
};

export type Rename = {
  from: string;
  to: string;
};

export type Delta = {
  id: string;
  actor: string | null;
  added: EmoteEntry[];
  removed: string[];
  renamed: Rename[];
};
