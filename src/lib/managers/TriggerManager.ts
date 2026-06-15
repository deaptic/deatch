import { Manager } from "./Manager.ts";
import { sendChatMessage } from "../api/twitch/chat.ts";
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

export class TriggerManager extends Manager {
  private lastFiredAt = new Map<string, number>();

  match(message: IncomingMessage): Trigger | null {
    if (message.broadcasterId !== user()?.id) return null;
    const trimmed = message.text.trim();
    if (!trimmed) return null;
    for (const trigger of triggers()) {
      if (!trigger.enabled || !trigger.phrase.trim()) continue;
      if (this.matches(trimmed, trigger)) return trigger;
    }
    return null;
  }

  handle(message: IncomingMessage): void {
    const trigger = this.match(message);
    if (!trigger || !trigger.response.trim()) return;

    const now = Date.now();
    const key = `${message.broadcasterId}:${trigger.id}`;
    const last = this.lastFiredAt.get(key) ?? 0;
    const cooldownMs = clampCooldown(trigger.cooldown) * 1000;
    if (now - last < cooldownMs) return;
    this.lastFiredAt.set(key, now);

    sendChatMessage({
      broadcasterId: message.broadcasterId,
      message: trigger.response,
      replyParentMessageId: trigger.action === "reply"
        ? message.messageId
        : null,
    });
  }

  private matches(text: string, trigger: Trigger): boolean {
    const phrases = trigger.phrase
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    return phrases.some((phrase) => this.matchesPhrase(text, phrase, trigger));
  }

  private matchesPhrase(
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
}

export const triggerManager = new TriggerManager();
