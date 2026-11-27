import { rankSuggestions } from "../../shared/rankSuggestions.ts";
import type { EmoteUse } from "./emoteUsage.ts";

const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000;

export const useScore = (use: EmoteUse, now: number) =>
  use.count * 0.5 ** (Math.max(0, now - use.lastUsed) / HALF_LIFE_MS);

export function rankEmotes<T extends { name: string }>(
  emotes: Iterable<T>,
  query: string,
  uses: readonly EmoteUse[],
  now: number,
  limit: number,
): T[] {
  const scores = new Map(uses.map((use) => [use.value, useScore(use, now)]));
  const scoreOf = (emote: T) => scores.get(emote.name) ?? 0;
  const ranked = rankSuggestions(emotes, query, {
    keys: (emote) => [emote.name.toLowerCase()],
    compare: (a, b) => scoreOf(b) - scoreOf(a) || a.name.localeCompare(b.name),
  });
  const lower = query.toLowerCase();
  const isExact = (emote: T) => emote.name.toLowerCase() === lower;
  const isUsed = (emote: T) => !isExact(emote) && scores.has(emote.name);
  const isRest = (emote: T) => !isExact(emote) && !scores.has(emote.name);
  return [
    ...ranked.filter(isExact),
    ...ranked.filter(isUsed),
    ...ranked.filter(isRest),
  ].slice(0, limit);
}
