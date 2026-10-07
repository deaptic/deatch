import * as backlog from "./backlog.ts";
import * as chatSettings from "./chatSettings.ts";
import { knownUser } from "../stores/users.ts";
import { selectedChannel } from "../stores/view.ts";
import { createLimiter } from "../utils/limiter.ts";

const CONCURRENCY = 3;

const limit = createLimiter(CONCURRENCY);

export function recover(broadcasterId: string, sinceMs: number): void {
  const urgent = selectedChannel()?.id === broadcasterId;
  limit(() => refill(broadcasterId, sinceMs), urgent);
}

async function refill(broadcasterId: string, sinceMs: number): Promise<void> {
  const login = knownUser(broadcasterId)?.login;
  await Promise.all([
    chatSettings.load(broadcasterId),
    login ? backlog.fillGap(broadcasterId, login, sinceMs) : undefined,
  ]);
}
