import type { Trigger, TriggerRole } from "../preferences/index.ts";
import { matchEnd } from "../../shared/wordMatch.ts";

export type Fired = { trigger: Trigger; args: string };

const RANK: Record<TriggerRole, number> = {
  everyone: 0,
  subscriber: 1,
  vip: 2,
  moderator: 3,
  broadcaster: 4,
};

const BADGE_RANK: Record<string, TriggerRole> = {
  founder: "subscriber",
  subscriber: "subscriber",
  vip: "vip",
  moderator: "moderator",
  lead_moderator: "moderator",
  broadcaster: "broadcaster",
};

export function firstMatch(text: string, triggers: Trigger[]): Fired | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  for (const trigger of triggers) {
    if (!trigger.enabled) continue;
    const end = matchEnd(
      trimmed,
      trigger.phrase.split("\n"),
      trigger.location,
      trigger.caseSensitive,
    );
    if (end !== null) return { trigger, args: trimmed.slice(end).trim() };
  }
  return null;
}

export function roleAllows(
  required: TriggerRole,
  badgeSets: string[],
): boolean {
  const ranks = badgeSets.map((set) => RANK[BADGE_RANK[set] ?? "everyone"]);
  return Math.max(0, ...ranks) >= RANK[required];
}

export function isCoolingDown(
  lastFiredAt: number | undefined,
  now: number,
  cooldownSeconds: number,
): boolean {
  return (
    lastFiredAt !== undefined && now - lastFiredAt < cooldownSeconds * 1000
  );
}
