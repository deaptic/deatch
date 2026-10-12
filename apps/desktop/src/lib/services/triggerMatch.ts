import type { Trigger } from "../stores/preferences.ts";
import { matchesTerms } from "../utils/wordMatch.ts";

export function firstMatch(text: string, triggers: Trigger[]): Trigger | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return triggers.find((t) => t.enabled && matches(trimmed, t)) ?? null;
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
  return matchesTerms(
    text,
    trigger.phrase.split("\n"),
    trigger.location,
    trigger.caseSensitive,
  );
}
