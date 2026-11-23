import { type MethodSpec, parse, problems } from "./triggerTemplate.ts";
import type { UserRef } from "../types/index.ts";
import type { MessageKey } from "../i18n/index.ts";
import { knownUser } from "../stores/users.ts";

export type TriggerContext = {
  broadcasterId: string;
  sender: UserRef;
  args: string;
  count: number;
};

type MethodResolve = (
  ctx: TriggerContext,
  arg: string | null,
) => Promise<string>;

export type Resolve = (name: string, arg: string | null) => Promise<string>;

export type TriggerMethod = MethodSpec & {
  argHint?: string;
  description: MessageKey;
  resolve: MethodResolve;
};

const RANGE = /^(-?\d+)-(-?\d+)$/;
const POSITION = /^[1-9]\d*$/;

const words = (args: string) => args.split(/\s+/).filter(Boolean);

export function typedTarget(args: string): string | null {
  return words(args)[0]?.replace(/^@/, "") || null;
}

function range(arg: string): [number, number] | null {
  const match = RANGE.exec(arg);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  return min <= max ? [min, max] : null;
}

function randomIn(arg: string | null): string {
  const [min, max] = range(arg ?? "") ?? [0, 0];
  return String(min + Math.floor(Math.random() * (max - min + 1)));
}

const sync =
  (fn: (ctx: TriggerContext, arg: string | null) => string): MethodResolve =>
  (ctx, arg) =>
    Promise.resolve(fn(ctx, arg));

export const METHODS: readonly TriggerMethod[] = [
  {
    name: "user",
    arg: "none",
    description: "SETTINGS_TRIGGERS_METHOD_USER",
    resolve: sync((ctx) => ctx.sender.displayName),
  },
  {
    name: "target",
    arg: "none",
    description: "SETTINGS_TRIGGERS_METHOD_TARGET",
    resolve: sync((ctx) => typedTarget(ctx.args) ?? ctx.sender.displayName),
  },
  {
    name: "args",
    arg: "optional",
    argHint: "1",
    validArg: (arg) => POSITION.test(arg),
    description: "SETTINGS_TRIGGERS_METHOD_ARGS",
    resolve: sync((ctx, arg) =>
      arg === null ? ctx.args : (words(ctx.args)[Number(arg) - 1] ?? ""),
    ),
  },
  {
    name: "channel",
    arg: "none",
    description: "SETTINGS_TRIGGERS_METHOD_CHANNEL",
    resolve: sync((ctx) => knownUser(ctx.broadcasterId)?.displayName ?? ""),
  },
  {
    name: "count",
    arg: "none",
    description: "SETTINGS_TRIGGERS_METHOD_COUNT",
    resolve: sync((ctx) => String(ctx.count)),
  },
  {
    name: "random",
    arg: "required",
    argHint: "1-100",
    validArg: (arg) => range(arg) !== null,
    description: "SETTINGS_TRIGGERS_METHOD_RANDOM",
    resolve: sync((_ctx, arg) => randomIn(arg)),
  },
];

export function resolverFor(ctx: TriggerContext): Resolve {
  const values = new Map<string, Promise<string>>();
  return (name, arg) => {
    const key = `${name}:${arg ?? ""}`;
    const known = values.get(key);
    if (known) return known;
    const method = METHODS.find((m) => m.name === name);
    const value = method ? method.resolve(ctx, arg) : Promise.resolve("");
    values.set(key, value);
    return value;
  };
}

export function methodSyntax(method: TriggerMethod): string {
  return method.argHint
    ? `{${method.name}:${method.argHint}}`
    : `{${method.name}}`;
}

export function templateProblems(template: string) {
  return problems(parse(template), METHODS);
}
