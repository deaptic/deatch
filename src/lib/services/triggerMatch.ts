import type { Trigger } from "../stores/preferences.ts";
import { wordPattern } from "../utils/wordMatch.ts";

export function firstMatch(text: string, triggers: Trigger[]): Trigger | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return triggers.find((t) =>
    t.enabled && t.phrase.trim() && matches(trimmed, t)
  ) ?? null;
}

export function isCoolingDown(
  lastFiredAt: number | undefined,
  now: number,
  cooldownSeconds: number,
): boolean {
  return lastFiredAt !== undefined &&
    now - lastFiredAt < cooldownSeconds * 1000;
}

function matches(text: string, trigger: Trigger): boolean {
  return trigger.phrase
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .some((phrase) => matchesPhrase(text, phrase, trigger));
}

function matchesPhrase(
  text: string,
  phrase: string,
  trigger: Trigger,
): boolean {
  if (trigger.location === "exact") {
    return trigger.caseSensitive
      ? text === phrase
      : text.toLowerCase() === phrase.toLowerCase();
  }
  const pattern = wordPattern([phrase], trigger.location);
  return new RegExp(pattern, trigger.caseSensitive ? "" : "i").test(text);
}
