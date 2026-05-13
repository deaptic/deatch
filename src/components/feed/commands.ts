import { deleteChatMessages, banUser, unbanUser } from "../../commands/moderation";
import { getUsers } from "../../commands/users";
import { addToast } from "../../state/toasts";

export type ChatCommandContext = {
  broadcasterId: string;
  broadcasterLogin: string;
};

export type ChatCommand = {
  name: string;
  aliases?: string[];
  usage?: string;
  description: string;
  execute: (args: string[], ctx: ChatCommandContext) => Promise<void>;
};

async function resolveUserId(rawLogin: string): Promise<string | null> {
  const login = rawLogin.replace(/^@/, "").toLowerCase();
  if (!login) return null;
  const users = await getUsers({ logins: [login] });
  return users[0]?.id ?? null;
}

const DURATION_UNITS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };

function parseDuration(raw: string): number | null {
  const m = raw.match(/^(\d+)([smhdw]?)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n * (DURATION_UNITS[m[2]] ?? 1);
}

export const chatCommands: ChatCommand[] = [
  {
    name: "clear",
    description: "Clear all messages in chat",
    execute: async (_args, ctx) => {
      await deleteChatMessages({ broadcasterId: ctx.broadcasterId, messageId: null });
    },
  },
  {
    name: "ban",
    usage: "[username] [reason]",
    description: "Permanently ban a user from Chat",
    execute: async (args, ctx) => {
      const [target, ...reasonParts] = args;
      if (!target) {
        addToast("Usage: /ban [username] [reason]", "error");
        return;
      }
      const userId = await resolveUserId(target);
      if (!userId) {
        addToast(`User not found: ${target}`, "error");
        return;
      }
      const reason = reasonParts.join(" ").trim() || null;
      await banUser({ broadcasterId: ctx.broadcasterId, userId, reason });
    },
  },
  {
    name: "timeout",
    usage: "[username] [duration] [reason]",
    description: "Temporarily ban a user from Chat",
    execute: async (args, ctx) => {
      const [target, durationRaw, ...reasonParts] = args;
      if (!target) {
        addToast("Usage: /timeout [username] [duration] [reason]", "error");
        return;
      }
      const duration = durationRaw ? parseDuration(durationRaw) : 600;
      if (duration === null) {
        addToast(`Invalid duration: ${durationRaw}`, "error");
        return;
      }
      const userId = await resolveUserId(target);
      if (!userId) {
        addToast(`User not found: ${target}`, "error");
        return;
      }
      const reason = reasonParts.join(" ").trim() || null;
      await banUser({ broadcasterId: ctx.broadcasterId, userId, duration, reason });
    },
  },
  {
    name: "unban",
    usage: "[username]",
    description: "Remove a ban on a user",
    execute: async (args, ctx) => {
      await runUnban(args, ctx, "/unban");
    },
  },
  {
    name: "untimeout",
    usage: "[username]",
    description: "Remove a timeout on a user",
    execute: async (args, ctx) => {
      await runUnban(args, ctx, "/untimeout");
    },
  },
];

async function runUnban(args: string[], ctx: ChatCommandContext, label: string) {
  const [target] = args;
  if (!target) {
    addToast(`Usage: ${label} [username]`, "error");
    return;
  }
  const userId = await resolveUserId(target);
  if (!userId) {
    addToast(`User not found: ${target}`, "error");
    return;
  }
  await unbanUser({ broadcasterId: ctx.broadcasterId, userId });
}

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
  try {
    await cmd.execute(rest, ctx);
  } catch {
    addToast(`/${head} failed`, "error");
  }
  return true;
}
