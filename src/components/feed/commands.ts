import { deleteChatMessages } from "../../commands/moderation";
import { addToast } from "../../state/toasts";

export type ChatCommandContext = {
  broadcasterId: string;
  broadcasterLogin: string;
};

export type ChatCommand = {
  name: string;
  aliases?: string[];
  description: string;
  execute: (args: string[], ctx: ChatCommandContext) => Promise<void>;
};

export const chatCommands: ChatCommand[] = [
  {
    name: "clear",
    description: "Clear all messages in chat",
    execute: async (_args, ctx) => {
      await deleteChatMessages({ broadcasterId: ctx.broadcasterId, messageId: null });
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
