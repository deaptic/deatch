import * as chat from "./chat.ts";
import * as triggerMatch from "./triggerMatch.ts";
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

function match(message: IncomingMessage): Trigger | null {
  if (message.broadcasterId !== user()?.id) return null;
  return triggerMatch.firstMatch(message.text, triggers());
}

export function handle(message: IncomingMessage): void {
  const trigger = match(message);
  if (!trigger || !trigger.response.trim()) return;

  const now = Date.now();
  const key = `${message.broadcasterId}:${trigger.id}`;
  const cooldown = clampCooldown(trigger.cooldown);
  if (triggerMatch.isCoolingDown(lastFiredAt.get(key), now, cooldown)) return;
  lastFiredAt.set(key, now);

  void chat.send({
    broadcasterId: message.broadcasterId,
    message: trigger.response,
    replyParentMessageId: trigger.action === "reply" ? message.messageId : null,
  });
}
