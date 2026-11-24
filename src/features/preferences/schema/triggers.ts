import type { Anchor } from "../../../shared/wordMatch.ts";
import { custom, flags, object, type Value } from "./fields.ts";

const text = (raw: unknown) => (typeof raw === "string" ? raw : "");

export const MIN_TRIGGER_COOLDOWN = 5;
export const MAX_TRIGGER_COOLDOWN = 600;

export function clampCooldown(value: number): number {
  if (!Number.isFinite(value)) return MIN_TRIGGER_COOLDOWN;
  return Math.min(
    MAX_TRIGGER_COOLDOWN,
    Math.max(MIN_TRIGGER_COOLDOWN, Math.floor(value)),
  );
}

export type TriggerAction = "send" | "reply";
export const TRIGGER_ROLES = [
  "everyone",
  "subscriber",
  "vip",
  "moderator",
  "broadcaster",
] as const;
export type TriggerRole = (typeof TRIGGER_ROLES)[number];
export const CONDITION_OPS = [
  "set",
  "empty",
  "is",
  "isNot",
  "contains",
  "notContains",
  "above",
  "below",
] as const;
export type ConditionOp = (typeof CONDITION_OPS)[number];
export type Condition = { left: string; op: ConditionOp; right: string };
export type ConditionalReply = { when: Condition[][]; text: string };
export const BUILT_IN_TRIGGERS = [
  "accountage",
  "followage",
  "game",
  "title",
  "uptime",
] as const;
export type BuiltInTrigger = (typeof BUILT_IN_TRIGGERS)[number];
export type Trigger = {
  id: string;
  enabled: boolean;
  name: string;
  phrase: string;
  location: Anchor;
  caseSensitive: boolean;
  cooldown: number;
  action: TriggerAction;
  replies: ConditionalReply[];
  otherwise: string;
  role: TriggerRole;
  count: number;
};

function conditions(raw: unknown): Condition[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const condition = item as Partial<Condition>;
    return [
      {
        left: text(condition.left),
        op: CONDITION_OPS.find((op) => op === condition.op) ?? "set",
        right: text(condition.right),
      },
    ];
  });
}

function replies(raw: unknown): ConditionalReply[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const reply = item as Partial<ConditionalReply>;
    const when = Array.isArray(reply.when)
      ? reply.when.map(conditions).filter((g) => g.length > 0)
      : [];
    return when.length ? [{ when, text: text(reply.text) }] : [];
  });
}

function trigger(item: unknown): Trigger[] {
  if (!item || typeof item !== "object") return [];
  const t = item as Partial<Trigger>;
  if (typeof t.id !== "string" || typeof t.phrase !== "string") return [];
  return [
    {
      id: t.id,
      enabled: t.enabled !== false,
      name: text(t.name),
      phrase: t.phrase,
      location:
        t.location === "start" || t.location === "exact"
          ? t.location
          : "anywhere",
      caseSensitive: t.caseSensitive === true,
      cooldown:
        typeof t.cooldown === "number"
          ? clampCooldown(t.cooldown)
          : MIN_TRIGGER_COOLDOWN,
      action: t.action === "send" ? "send" : "reply",
      replies: replies(t.replies),
      otherwise: text(t.otherwise),
      role: TRIGGER_ROLES.find((r) => r === t.role) ?? "everyone",
      count:
        typeof t.count === "number" && Number.isFinite(t.count)
          ? Math.max(0, Math.floor(t.count))
          : 0,
    },
  ];
}

export const TRIGGERS = object({
  builtIn: flags(BUILT_IN_TRIGGERS, () => false),
  custom: custom<Trigger[]>(
    () => [],
    (raw) => (Array.isArray(raw) ? raw.flatMap(trigger) : []),
  ),
});

export type TriggerPreferences = Value<typeof TRIGGERS>;
