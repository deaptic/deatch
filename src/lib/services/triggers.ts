import * as chat from "./chat.ts";
import { user } from "../stores/users.ts";
import {
  clampCooldown,
  type Trigger,
  triggers,
} from "../stores/preferences.ts";

export type IncomingMessage = {
  text: string;
  broadcasterId: string;
  messageId: string;
};

const lastFiredAt = new Map<string, number>();

export function match(message: IncomingMessage): Trigger | null {
  if (message.broadcasterId !== user()?.id) return null;
  const trimmed = message.text.trim();
  if (!trimmed) return null;
  for (const trigger of triggers()) {
    if (!trigger.enabled || !trigger.phrase.trim()) continue;
    if (matches(trimmed, trigger)) return trigger;
  }
  return null;
}

export function handle(message: IncomingMessage): void {
  const trigger = match(message);
  if (!trigger || !trigger.response.trim()) return;

  const now = Date.now();
  const key = `${message.broadcasterId}:${trigger.id}`;
  const last = lastFiredAt.get(key) ?? 0;
  const cooldownMs = clampCooldown(trigger.cooldown) * 1000;
  if (now - last < cooldownMs) return;
  lastFiredAt.set(key, now);

  void chat.send({
    broadcasterId: message.broadcasterId,
    message: trigger.response,
    replyParentMessageId: trigger.action === "reply" ? message.messageId : null,
  });
}

function matches(text: string, trigger: Trigger): boolean {
  const phrases = trigger.phrase
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  return phrases.some((phrase) => matchesPhrase(text, phrase, trigger));
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
    ? `^(${escaped})\\b`
    : `\\b(${escaped})\\b`;
  return new RegExp(pattern, trigger.caseSensitive ? "" : "i").test(text);
}
