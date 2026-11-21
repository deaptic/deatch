import { at } from "../../../lib/utils/at.ts";
export type Kind = "emote" | "mention" | "command";
export type Active = { kind: Kind; query: string };

export const TRIGGERS: Record<Kind, RegExp> = {
  command: /^\/(\w*)$/,
  emote: /(?:^|\s):(\w+)$/,
  mention: /(?:^|\s)@(\w*)$/,
};

const ORDER: Kind[] = ["command", "emote", "mention"];

export function detect(before: string): Active | null {
  for (const kind of ORDER) {
    const match = before.match(TRIGGERS[kind]);
    if (match) return { kind, query: at(match, 1) };
  }
  return null;
}
