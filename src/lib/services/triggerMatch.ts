import type { Trigger } from "../stores/preferences.ts";

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
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = trigger.location === "start"
    ? `^${escaped}${NOT_WORD_AFTER}`
    : `${NOT_WORD_BEFORE}${escaped}${NOT_WORD_AFTER}`;
  return new RegExp(pattern, trigger.caseSensitive ? "" : "i").test(text);
}

// `\b` needs a word character on one side, so it never matches around
// phrases like "!socials"; lookarounds only forbid a word character touching
// the phrase.
const NOT_WORD_BEFORE = "(?<!\\w)";
const NOT_WORD_AFTER = "(?!\\w)";
