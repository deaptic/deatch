import { at } from "../../../lib/utils/at.ts";
export type Kind = "emote" | "mention" | "command";
export type Active = { kind: Kind; query: string };

/// Which popup the text before the cursor asks for, if any.
export function detect(before: string): Active | null {
  const cmd = before.match(/^\/(\w*)$/);
  if (cmd) return { kind: "command", query: at(cmd, 1) };
  const em = before.match(/(?:^|\s):(\w+)$/);
  if (em) return { kind: "emote", query: at(em, 1) };
  const mn = before.match(/(?:^|\s)@(\w*)$/);
  if (mn) return { kind: "mention", query: at(mn, 1) };
  return null;
}
