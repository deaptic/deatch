import { chat } from "../chat/index.ts";
import * as match from "./match.ts";
import { phraseOf, BUILT_INS } from "./builtIns/index.ts";
import { failed } from "./builtIns/context.ts";
import { matchEnd } from "../../shared/wordMatch.ts";
import { parse, render } from "./template.ts";
import { type Resolve, resolverFor, templateProblems } from "./methods.ts";
import { holds, needsValue, satisfied } from "./conditions.ts";
import type { UserRef } from "../../shared/types/index.ts";
import { knownUser, user } from "../users/index.ts";
import { MAX_MESSAGE_LENGTH } from "../../shared/twitch.ts";
import {
  clampCooldown,
  type Condition,
  MIN_TRIGGER_COOLDOWN,
  type Trigger,
} from "../preferences/index.ts";
import { countReply, builtInEnabled, customTriggers } from "./saved.ts";

type IncomingMessage = {
  text: string;
  broadcasterId: string;
  messageId: string;
  chatter: UserRef;
  badgeSets: string[];
};

const lastFiredAt = new Map<string, number>();
const sentAt = new Map<string, number>();
const ECHO_WINDOW_MS = 30_000;

function isOwnEcho(message: IncomingMessage): boolean {
  const now = Date.now();
  for (const [text, at] of sentAt) {
    if (now - at > ECHO_WINDOW_MS) sentAt.delete(text);
  }
  return (
    message.chatter.id === message.broadcasterId &&
    sentAt.delete(message.text.trim())
  );
}

async function check(
  { left, op, right }: Condition,
  resolve: Resolve,
): Promise<boolean> {
  const [a, b] = await Promise.all([
    render(parse(left), resolve),
    render(parse(right), resolve),
  ]);
  return holds(op, a, b);
}

async function chooseTemplate(
  trigger: Trigger,
  resolve: Resolve,
): Promise<string> {
  for (const reply of trigger.replies) {
    const results = await Promise.all(
      reply.when.map((group) =>
        Promise.all(group.map((c) => check(c, resolve))),
      ),
    );
    if (satisfied(results)) return reply.text;
  }
  return trigger.otherwise;
}

async function replyFor(trigger: Trigger, resolve: Resolve): Promise<string> {
  const template = await chooseTemplate(trigger, resolve);
  const text = await render(parse(template), resolve);
  return text.trim().slice(0, MAX_MESSAGE_LENGTH);
}

export function isComplete(trigger: Trigger): boolean {
  const templates = [
    trigger.otherwise,
    ...trigger.replies.flatMap((r) => [
      r.text,
      ...r.when.flat().flatMap((c) => [c.left, c.right]),
    ]),
  ];
  const repliesFilled = trigger.replies.every(
    ({ text, when }) =>
      !!text.trim() &&
      when.length > 0 &&
      when
        .flat()
        .every(
          ({ left, op, right }) =>
            !!left.trim() && (!needsValue(op) || !!right.trim()),
        ),
  );
  return (
    !!trigger.name.trim() &&
    !!trigger.phrase.trim() &&
    (!!trigger.otherwise.trim() || trigger.replies.length > 0) &&
    repliesFilled &&
    templates.every((t) => templateProblems(t).length === 0)
  );
}

function eligible(message: IncomingMessage): Trigger[] {
  return customTriggers().filter((t) =>
    match.roleAllows(t.role, message.badgeSets),
  );
}

function coolingDown(
  broadcasterId: string,
  id: string,
  seconds: number,
): boolean {
  const now = Date.now();
  const key = `${broadcasterId}:${id}`;
  if (match.isCoolingDown(lastFiredAt.get(key), now, seconds)) {
    return true;
  }
  lastFiredAt.set(key, now);
  return false;
}

function send(
  message: IncomingMessage,
  text: string,
  reply: boolean,
): Promise<chat.SendOutcome> {
  sentAt.set(text, Date.now());
  return chat.send(
    {
      broadcasterId: message.broadcasterId,
      message: text,
      replyParentMessageId: reply ? message.messageId : null,
    },
    { silent: true },
  );
}

function builtInFor(text: string) {
  const trimmed = text.trim();
  for (const builtIn of BUILT_INS) {
    if (!builtInEnabled(builtIn.key)) continue;
    const end = matchEnd(trimmed, [phraseOf(builtIn)], "start");
    if (end !== null) return { builtIn, args: trimmed.slice(end).trim() };
  }
  return null;
}

function handleBuiltIn(message: IncomingMessage): boolean {
  const found = builtInFor(message.text);
  if (!found) return false;
  const { builtIn, args } = found;
  if (coolingDown(message.broadcasterId, builtIn.key, MIN_TRIGGER_COOLDOWN)) {
    return true;
  }
  void builtIn
    .run({
      broadcasterId: message.broadcasterId,
      sender: message.chatter,
      args,
      isModerator: match.roleAllows("moderator", message.badgeSets),
    })
    .catch((e: unknown) => {
      console.warn(`${phraseOf(builtIn)} failed`, e);
      return failed();
    })
    .then((text) => (text ? send(message, text, true) : undefined));
  return true;
}

async function respond(
  fired: match.Fired,
  message: IncomingMessage,
): Promise<void> {
  const resolve = resolverFor({
    broadcasterId: message.broadcasterId,
    channelName: knownUser(message.broadcasterId)?.displayName ?? "",
    sender: message.chatter,
    args: fired.args,
    count: fired.trigger.count + 1,
  });
  const text = await replyFor(fired.trigger, resolve);
  if (!text) return;
  const outcome = await send(message, text, fired.trigger.action === "reply");
  if (outcome === "sent") countReply(fired.trigger.id);
}

export function handle(message: IncomingMessage): void {
  if (message.broadcasterId !== user()?.id || isOwnEcho(message)) return;
  if (handleBuiltIn(message)) return;
  const fired = match.firstMatch(message.text, eligible(message));
  if (!fired) return;
  const cooldown = clampCooldown(fired.trigger.cooldown);
  if (coolingDown(message.broadcasterId, fired.trigger.id, cooldown)) return;
  void respond(fired, message);
}

export type Preview = { text: string; filled: [string, string][] };

export async function preview(
  trigger: Trigger,
  text: string,
): Promise<Preview | null> {
  const me = user();
  const fired = match.firstMatch(text, [{ ...trigger, enabled: true }]);
  if (!me || !fired) return null;
  const resolve = resolverFor({
    broadcasterId: me.id,
    channelName: me.displayName,
    sender: me,
    args: fired.args,
    count: trigger.count + 1,
  });
  const filled = new Map<string, string>();
  const reply = await replyFor(trigger, async (name, arg) => {
    const value = await resolve(name, arg);
    filled.set(arg === null ? `{${name}}` : `{${name}:${arg}}`, value);
    return value;
  });
  return { text: reply, filled: [...filled] };
}
