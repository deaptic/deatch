import { deleteChatMessages, banUser, unbanUser } from "../../commands/moderation";
import { sendShoutout } from "../../commands/chat";
import { getUsers } from "../../commands/users";
import { addToast } from "../../state/toasts";

export type ChatCommandContext = {
  broadcasterId: string;
  broadcasterLogin: string;
};

export type OptionType = "user" | "string" | "duration";

export type CommandOption = {
  name: string;
  description: string;
  type: OptionType;
  required?: boolean;
  default?: unknown;
};

export type ChatCommand = {
  name: string;
  aliases?: string[];
  description: string;
  options: CommandOption[];
  execute: (values: Record<string, unknown>, ctx: ChatCommandContext) => Promise<void>;
};

const DURATION_UNITS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };

function parseDuration(raw: string): number | null {
  const m = raw.match(/^(\d+)([smhdw]?)$/);
  if (!m) return null;
  return parseInt(m[1], 10) * (DURATION_UNITS[m[2]] ?? 1);
}

async function resolveUserId(rawLogin: string): Promise<string | null> {
  const login = rawLogin.replace(/^@/, "").toLowerCase();
  if (!login) return null;
  const users = await getUsers({ logins: [login] });
  return users[0]?.id ?? null;
}

export function buildUsage(options: CommandOption[]): string {
  return options.map((o) => `[${o.name}]`).join(" ");
}

type ParseResult =
  | { values: Record<string, unknown> }
  | { error: string };

async function parseArgs(raw: string[], options: CommandOption[]): Promise<ParseResult> {
  const values: Record<string, unknown> = {};
  let i = 0;
  for (const opt of options) {
    if (opt.type === "string") {
      const joined = raw.slice(i).join(" ").trim();
      if (!joined) {
        if (opt.required) return { error: `Missing ${opt.name}` };
        values[opt.name] = opt.default ?? null;
      } else {
        values[opt.name] = joined;
      }
      i = raw.length;
      continue;
    }
    const arg = raw[i];
    if (arg === undefined) {
      if (opt.required) return { error: `Missing ${opt.name}` };
      values[opt.name] = opt.default ?? null;
      continue;
    }
    if (opt.type === "user") {
      const userId = await resolveUserId(arg);
      if (!userId) return { error: `User not found: ${arg}` };
      values[opt.name] = userId;
    } else if (opt.type === "duration") {
      const d = parseDuration(arg);
      if (d === null) return { error: `Invalid duration: ${arg}` };
      values[opt.name] = d;
    }
    i++;
  }
  return { values };
}

export const chatCommands: ChatCommand[] = [
  {
    name: "clear",
    description: "Clear all messages in chat",
    options: [],
    execute: async (_, ctx) => {
      await deleteChatMessages({ broadcasterId: ctx.broadcasterId, messageId: null });
    },
  },
  {
    name: "ban",
    description: "Permanently ban a user from Chat",
    options: [
      { name: "username", description: "User to ban", type: "user", required: true },
      { name: "reason", description: "Reason", type: "string" },
    ],
    execute: async ({ username, reason }, ctx) => {
      await banUser({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
        reason: (reason as string | null) ?? null,
      });
    },
  },
  {
    name: "timeout",
    description: "Temporarily ban a user from Chat",
    options: [
      { name: "username", description: "User to time out", type: "user", required: true },
      { name: "duration", description: "Duration", type: "duration", default: 600 },
      { name: "reason", description: "Reason", type: "string" },
    ],
    execute: async ({ username, duration, reason }, ctx) => {
      await banUser({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
        duration: duration as number,
        reason: (reason as string | null) ?? null,
      });
    },
  },
  {
    name: "unban",
    description: "Remove a ban on a user",
    options: [
      { name: "username", description: "User to unban", type: "user", required: true },
    ],
    execute: async ({ username }, ctx) => {
      await unbanUser({ broadcasterId: ctx.broadcasterId, userId: username as string });
    },
  },
  {
    name: "shoutout",
    aliases: ["so"],
    description: "Highlight a channel for viewers to follow",
    options: [
      { name: "username", description: "Channel to shout out", type: "user", required: true },
    ],
    execute: async ({ username }, ctx) => {
      await sendShoutout({
        fromBroadcasterId: ctx.broadcasterId,
        toBroadcasterId: username as string,
      });
    },
  },
  {
    name: "untimeout",
    description: "Remove a timeout on a user",
    options: [
      { name: "username", description: "User to remove timeout from", type: "user", required: true },
    ],
    execute: async ({ username }, ctx) => {
      await unbanUser({ broadcasterId: ctx.broadcasterId, userId: username as string });
    },
  },
];

export async function executeChatCommand(
  input: string,
  ctx: ChatCommandContext,
): Promise<boolean> {
  if (!input.startsWith("/")) return false;
  const [head, ...rest] = input.slice(1).split(/\s+/);
  const cmd = chatCommands.find(
    (c) => c.name === head || c.aliases?.includes(head),
  );
  if (!cmd) {
    addToast(`Unknown command: /${head}`, "error");
    return true;
  }
  const parsed = await parseArgs(rest, cmd.options);
  if ("error" in parsed) {
    addToast(parsed.error, "error");
    return true;
  }
  try {
    await cmd.execute(parsed.values, ctx);
  } catch {
    addToast(`/${head} failed`, "error");
  }
  return true;
}
