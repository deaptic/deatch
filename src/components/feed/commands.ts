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
    name: "unban",
    usage: "[username]",
    description: "Remove a ban on a user",
    execute: async (args, ctx) => {
      const [target] = args;
      if (!target) {
        addToast("Usage: /unban [username]", "error");
        return;
      }
      const userId = await resolveUserId(target);
      if (!userId) {
        addToast(`User not found: ${target}`, "error");
        return;
      }
      await unbanUser({ broadcasterId: ctx.broadcasterId, userId });
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
  try {
    await cmd.execute(rest, ctx);
  } catch {
    addToast(`/${head} failed`, "error");
  }
  return true;
}
